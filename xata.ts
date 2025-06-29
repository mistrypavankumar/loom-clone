// Generated by Xata Codegen 0.30.1. Please do not edit.
import type { BaseClientOptions } from '@xata.io/client';
import { buildClient } from '@xata.io/client';

export type DatabaseSchema = {};

const defaultOptions: BaseClientOptions = {
  databaseURL: process.env.DATABASE_URL,
  apiKey: process.env.XATA_API_KEY,
  branch: 'main',
};

const DatabaseClient = buildClient<DatabaseSchema>();

export class XataClient extends DatabaseClient {
  constructor(options?: BaseClientOptions) {
    super({ ...defaultOptions, ...options });
  }
}

let instance: XataClient | undefined;

export const getXataClient = (): XataClient => {
  if (!instance) {
    instance = new XataClient();
  }
  return instance;
};
