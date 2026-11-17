import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { updateVisitorStats } from './update-visitor-stats.mjs';

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'yuxin-visitors-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return path.join(directory, 'visitor-stats.json');
}

const countRow = (value) => ({ metricValues: [{ value: String(value) }] });
const countryRow = (name, code, value) => ({
  dimensionValues: [{ value: name }, { value: code }], ...countRow(value),
});
function reports(total, rows) {
  return {
    async runReport(request) {
      return [{ rows: request.dimensions ? rows : [countRow(total)] }];
    },
  };
}
const options = { propertyId: '123456789', hostname: 'liangyuxinrainie.github.io' };

test('reports are scoped to this website and optional stream; unknown locations do not inflate rankings', async (t) => {
  const outputPath = await fixture(t);
  const requests = [];
  const client = {
    async runReport(request) {
      requests.push(request);
      return [{ rows: request.dimensions ? [
        countryRow('United States', 'US', 2), countryRow('(not set)', '', 1),
        countryRow('China', 'CN', 5), countryRow('Australia', 'AU', 0),
      ] : [countRow(7)] }];
    },
  };
  const { stats } = await updateVisitorStats({ ...options, streamId: '9876543210', client, outputPath });
  assert.equal(stats.visitors, 7);
  assert.deepEqual(stats.countries.map((entry) => entry.code), ['CN', 'US']);
  for (const request of requests) {
    assert.equal(request.property, 'properties/123456789');
    assert.deepEqual(request.dimensionFilter.andGroup.expressions.map((item) => [
      item.filter.fieldName, item.filter.stringFilter.value,
    ]), [['hostName', options.hostname], ['streamId', '9876543210']]);
  }
  assert.deepEqual(JSON.parse(await fs.readFile(outputPath, 'utf8')), stats);
});

test('an API failure preserves the last published statistics', async (t) => {
  const outputPath = await fixture(t);
  const previous = '{"visitors":42,"countries":[],"updatedAt":"2026-11-16T00:00:00.000Z"}\n';
  await fs.writeFile(outputPath, previous);
  const client = {
    async runReport(request) {
      if (request.dimensions) throw new Error('PERMISSION_DENIED');
      return [{ rows: [countRow(0)] }];
    },
  };
  await assert.rejects(updateVisitorStats({ ...options, client, outputPath }), /PERMISSION_DENIED/);
  assert.equal(await fs.readFile(outputPath, 'utf8'), previous);
});

test('a successful empty report is distinguished from an unconfigured placeholder', async (t) => {
  const outputPath = await fixture(t);
  await fs.writeFile(outputPath, '{"visitors":0,"countries":[],"updatedAt":null}');
  const { changed, stats } = await updateVisitorStats({
    ...options, outputPath, client: { async runReport() { return [{ rows: [] }]; } },
  });
  assert.equal(changed, true);
  assert.equal(stats.visitors, 0);
  assert.deepEqual(stats.countries, []);
  assert.ok(stats.updatedAt);
});

test('unchanged reports preserve their timestamp and file bytes', async (t) => {
  const outputPath = await fixture(t);
  const client = reports(2, [countryRow('China', 'CN', 2)]);
  await updateVisitorStats({ ...options, outputPath, client });
  const previous = await fs.readFile(outputPath, 'utf8');
  const result = await updateVisitorStats({ ...options, outputPath, client });
  assert.equal(result.changed, false);
  assert.equal(await fs.readFile(outputPath, 'utf8'), previous);
});

test('an invalid property ID is rejected before sending requests', async (t) => {
  const outputPath = await fixture(t);
  const client = { runReport() { assert.fail('Must validate property ID first.'); } };
  await assert.rejects(updateVisitorStats({
    ...options, propertyId: 'G-L4W4XSTEX3', client, outputPath,
  }), /numeric GA4 property ID/);
});
