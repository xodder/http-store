import { Request, Response, NextFunction } from "express";
import { decrypt, encrypt } from "./utils/crypt";
import omitBy from "./utils/omit-by";

type StorageBlock = {
  key: string;
  value: any;
  expiresAt: number;
};

type StorageBlockCollection = Record<string, StorageBlock>;

type HttpBlockStorageConfig = {
  headerName: string;
  encryptionKey: string;
};

export class HttpBlockStorage {
  private req: Request;
  private res: Response;
  private config: HttpBlockStorageConfig;
  private blocks: StorageBlockCollection;

  constructor(req: Request, res: Response, config: HttpBlockStorageConfig) {
    this.req = req;
    this.res = res;
    this.config = config;
    this.blocks = this.getActiveBlocks();
  }

  private getActiveBlocks() {
    const token = this.extractTokenFromReq();
    const blocks = this.transformTokenToBlocks(token);

    return omitBy(blocks, this.isExpiredBlock)!;
  }

  private extractTokenFromReq() {
    return this.req.get(this.config.headerName) || "";
  }

  private transformTokenToBlocks(token?: string) {
    return !token
      ? {}
      : (decrypt(token, this.config.encryptionKey) as StorageBlockCollection);
  }

  private isExpiredBlock(block: StorageBlock) {
    return block.expiresAt < Date.now();
  }

  has(key: string) {
    return key in this.blocks;
  }

  get(key: string) {
    return this.blocks[key]?.value;
  }

  getAge(key: string) {
    const block = this.blocks[key];

    if (!block) {
      return 0;
    }

    return block.expiresAt - Date.now();
  }

  put(key: string, value: any, age: number) {
    this.blocks[key] = {
      key,
      value,
      expiresAt: Date.now() + age,
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
    this.res.set(
      this.config.headerName,
      this.transformBlocksToToken(this.blocks)
    );
  }

  private transformBlocksToToken(blocks: StorageBlockCollection) {
    return encrypt(blocks, this.config.encryptionKey);
  }
}

declare global {
  namespace Express {
    interface Request {
      store: HttpBlockStorage;
    }
  }
}

function store(config: HttpBlockStorageConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.store = new HttpBlockStorage(req, res, config);
    next();
  };
}

export default store;
