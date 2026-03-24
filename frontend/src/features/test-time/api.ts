import { httpRequest } from '../../lib/http';

export type TestTimeResponse = {
  now: string;
};

export function getTestTime(): Promise<TestTimeResponse> {
  return httpRequest<TestTimeResponse>('/api/test/time');
}

export function setTestTime(date: string): Promise<TestTimeResponse> {
  return httpRequest<TestTimeResponse>('/api/test/time/set', {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
}

export function advanceTestTimeDays(days: number): Promise<TestTimeResponse> {
  return httpRequest<TestTimeResponse>('/api/test/time/advance-days', {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
}

export function advanceTestTimeMonths(months: number): Promise<TestTimeResponse> {
  return httpRequest<TestTimeResponse>('/api/test/time/advance-months', {
    method: 'POST',
    body: JSON.stringify({ months }),
  });
}

export function resetTestTime(): Promise<TestTimeResponse> {
  return httpRequest<TestTimeResponse>('/api/test/time/reset', {
    method: 'POST',
  });
}
