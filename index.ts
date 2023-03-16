import { Request, Response } from 'express';
import omitBy from 'lodash/omitBy';
import { decrypt, encrypt } from './utils/crypt';

const HEADER_NAME = 'X-Data';

type StorageBlock = {
  key: string;
  value: any;
  expires_at: number;
};

type StorageBlockCollection = Record<string, StorageBlock>;

export class HttpBlockStorage {
  private req: Request;
  private res: Response;
  private __blocks: StorageBlockCollection;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
    this.__blocks = this.get_active_blocks();
  }

  private get_active_blocks() {
    const token = this.extract_token_from_req();
    const blocks = this.transform_token_to_blocks(token);

    return omitBy(blocks, this.is_expired_block);
  }

  private extract_token_from_req() {
    return this.req.get(HEADER_NAME) || '';
  }

  private transform_token_to_blocks(token?: string) {
    return !token ? {} : (decrypt(token) as StorageBlockCollection);
  }

  private is_expired_block(block: StorageBlock) {
    return block.expires_at < Date.now();
  }

  has(key: string) {
    return key in this.__blocks;
  }

  get(key: string) {
    return this.__blocks[key]?.value;
  }

  get_age(key: string) {
    const block = this.__blocks[key];

    if (!block) {
      return 0;
    }

    return block.expires_at - Date.now();
  }

  put(key: string, value: any, age: number) {
    this.__blocks[key] = {
      key,
      value,
      expires_at: Date.now() + age,
    };

    this.__flush();
  }

  remove(key: string) {
    delete this.__blocks[key];
    this.__flush();
  }

  clear() {
    this.__blocks = {};
    this.__flush();
  }

  private __flush() {
    this.res.set(HEADER_NAME, this.transform_blocks_to_token(this.__blocks));
  }

  private transform_blocks_to_token(blocks: StorageBlockCollection) {
    return encrypt(blocks);
  }
}

function make_x_data(req: Request, res: Response) {
  return new HttpBlockStorage(req, res);
}

export default make_x_data;
