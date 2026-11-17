import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function userCount(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error('GA4 returned an invalid visitor count; previous statistics were preserved.');
  }
  return number;
}

export async function updateVisitorStats({
  client, propertyId, hostname, streamId = '', startDate = '2020-10-14',
  endDate = 'today', outputPath, now = () => new Date(),
}) {
  const id = String(propertyId || '').replace(/^properties\//, '').trim();
  if (!/^\d+$/.test(id)) throw new Error('Set the numeric GA4 property ID, not the Measurement ID or Stream ID.');
  if (!hostname) throw new Error('A website hostname is required to scope visitor statistics.');
  if (streamId && !/^\d+$/.test(streamId)) throw new Error('GA_STREAM_ID must contain only digits.');

  const filters = [{
    filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: hostname } },
  }];
  if (streamId) {
    filters.push({ filter: { fieldName: 'streamId', stringFilter: { matchType: 'EXACT', value: streamId } } });
  }
  const request = {
    property: 'properties/' + id,
    metrics: [{ name: 'totalUsers' }],
    dateRanges: [{ startDate, endDate }],
    dimensionFilter: { andGroup: { expressions: filters } },
  };

  // Write only after BOTH reports succeed. API failures must not reset published counts.
  const [[userReport], [countryReport]] = await Promise.all([
    client.runReport(request, { timeout: 60000 }),
    client.runReport({
      ...request,
      dimensions: [{ name: 'country' }, { name: 'countryId' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 300,
    }, { timeout: 60000 }),
  ]);
  const visitors = userCount(userReport.rows?.[0]?.metricValues?.[0]?.value ?? 0);
  const countries = (countryReport.rows || []).map((row) => ({
    name: row.dimensionValues?.[0]?.value || '',
    code: row.dimensionValues?.[1]?.value || '',
    value: userCount(row.metricValues?.[0]?.value ?? 0),
  })).filter((country) => country.name && country.name !== '(not set)' && country.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  const nextStats = { visitors, countries, startDate, endDate, hostname, streamId };
  let previous;
  try {
    previous = JSON.parse(await fs.readFile(outputPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (previous?.updatedAt && Object.keys(nextStats).every(
    (key) => JSON.stringify(previous[key]) === JSON.stringify(nextStats[key]),
  )) {
    return { changed: false, stats: previous };
  }

  const stats = { ...nextStats, updatedAt: now().toISOString() };
  const temporaryPath = outputPath + '.tmp';
  await fs.writeFile(temporaryPath, JSON.stringify(stats, null, 2) + '\n');
  await fs.rename(temporaryPath, outputPath);
  return { changed: true, stats };
}

async function main() {
  const analytics = parse(await fs.readFile(path.join(projectDirectory, 'content/analytics.toml'), 'utf8'));
  const site = parse(await fs.readFile(path.join(projectDirectory, 'content/config.toml'), 'utf8'));
  const propertyId = (process.env.GA_PROPERTY_ID || String(analytics.property_id || '')).trim();
  const credentialsValue = process.env.GA_CREDENTIALS;
  const configured = Boolean(propertyId && credentialsValue);
  if (process.argv.includes('--check-config')) {
    if (process.env.GITHUB_OUTPUT) {
      await fs.appendFile(process.env.GITHUB_OUTPUT, 'configured=' + configured + '\n');
    }
    console.log(configured
      ? 'GA4 report configuration is present.'
      : 'Visitor update skipped: set the GA4 property ID in content/analytics.toml (or GA_PROPERTY_ID Secret) and add the GA_CREDENTIALS Secret. See docs/visitor-map.md.');
    return;
  }
  if (!configured) throw new Error('GA4 property ID and GA_CREDENTIALS are required. See docs/visitor-map.md.');

  let credentials;
  try {
    credentials = JSON.parse(credentialsValue);
  } catch {
    throw new Error('GA_CREDENTIALS must be the complete service-account JSON key.');
  }
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GA_CREDENTIALS is missing its service-account email or private key.');
  }

  const result = await updateVisitorStats({
    client: new BetaAnalyticsDataClient({ credentials }),
    propertyId,
    hostname: process.env.GA_HOSTNAME || new URL(site.site.url).hostname,
    streamId: process.env.GA_STREAM_ID || String(analytics.stream_id || ''),
    startDate: process.env.GA_START_DATE || analytics.start_date || '2020-10-14',
    endDate: process.env.GA_END_DATE || 'today',
    outputPath: path.join(projectDirectory, 'public/visitor-stats.json'),
  });
  console.log((result.changed ? 'Updated' : 'Unchanged') + ': ' + result.stats.visitors +
    ' visitors across ' + result.stats.countries.length + ' countries/regions.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    // Do not print credential contents or SDK request objects to Actions logs.
    console.error('Visitor update failed. Existing statistics were preserved.');
    console.error(error.code
      ? 'GA4 error code: ' + error.code + '. Check API enablement, property ID and service-account Viewer access.'
      : error.message);
    process.exitCode = 1;
  });
}
