import { Request, Response } from "express";
import omitBy from "lodash/omitBy";
import { decrypt, encrypt } from "./utils/crypt";

const HEADER_NAME = "X-Data";

type StorageBlock = {
  key: string;
  value: any;
  expires_at: number;
};

type StorageBlockCollection = Record<string, StorageBlock>;

export class HttpBlockStorage {
  private req: Request;
  private res: Response;
  private blocks: StorageBlockCollection;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
    this.blocks = this.getActiveBlocks();
  }

  private getActiveBlocks() {
    const token = this.extractTokenFromReq();
    const blocks = this.transformTokenToBlocks(token);

    return omitBy(blocks, this.isExpiredBlock);
  }

  private extractTokenFromReq() {
    return this.req.get(HEADER_NAME) || "";
  }

  private transformTokenToBlocks(token?: string) {
    return !token ? {} : (decrypt(token) as StorageBlockCollection);
  }

  private isExpiredBlock(block: StorageBlock) {
    return block.expires_at < Date.now();
  }

  has(key: string) {
    return key in this.blocks;
  }

  get(key: string) {
    return this.blocks[key]?.value;
  }

  get_age(key: string) {
    const block = this.blocks[key];

    if (!block) {
      return 0;
    }

    return block.expires_at - Date.now();
  }

  put(key: string, value: any, age: number) {
    this.blocks[key] = {
      key,
      value,
      expires_at: Date.now() + age,
    };

    this.flush();
  }

  remove(key: string) {
    delete this.blocks[key];
    this.flush();
  }

  clear() {
    this.blocks = {};
    this.flush();
  }

  private flush() {
    this.res.set(HEADER_NAME, this.transformBlocksToToken(this.blocks));
  }

  private transformBlocksToToken(blocks: StorageBlockCollection) {
    return encrypt(blocks);
  }
}

function make_x_data(req: Request, res: Response) {
  return new HttpBlockStorage(req, res);
}

export default make_x_data;
