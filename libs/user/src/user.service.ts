import { AppEnvService } from '@app/app-env/app-env.service';
import { RedlockService } from '@app/redlock/redlock.service';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserItemResDto } from './dto/user-item.res.dto';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from './user.meta';
import { UserDocument } from './user.schema';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectModel(UserDocument.name) private userModel: Model<UserDocument>,
    private readonly appEnvService: AppEnvService,
    private readonly redlockService: RedlockService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.redlockService.using('check-default-user', 10_000, async () => {
      await this.createDefaultUser();
      console.log('Successfully checked/created default system user.');
    });
  }

  private getValueFromConfig(key: string, min: number, max: number): string {
    let value = this.appEnvService.get<string>(key);
    if (typeof value !== 'string') {
      throw new Error(`${key} must be a string`);
    }

    value = value.trim();
    if (value.length < min) {
      throw new Error(`${key} must be at least ${min} characters long`);
    }

    if (value.length > max) {
      throw new Error(`${key} must be at most ${max} characters long`);
    }

    return value;
  }

  private async createDefaultUser(): Promise<UserDocument | null> {
    const DEFAULT_USERNAME = this.getValueFromConfig('USER_INIT_USERNAME', USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH);
    const DEFAULT_PASSWORD = this.getValueFromConfig('USER_INIT_PASSWORD', PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH);

    const existingUser = await this.findOneByUsername(DEFAULT_USERNAME);

    if (existingUser) {
      return existingUser;
    }

    return this.createOne({ username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD });
  }

  async findOneById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id });
  }

  async findOneByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async createOne(payload: { username: string; password: string }): Promise<UserDocument> {
    const { username, password } = payload;

    if (username.length < USERNAME_MIN_LENGTH) {
      throw new BadRequestException(`Username must be at least ${USERNAME_MIN_LENGTH} characters long`);
    }
    if (username.length > USERNAME_MAX_LENGTH) {
      throw new BadRequestException(`Username must be at most ${USERNAME_MAX_LENGTH} characters long`);
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      throw new BadRequestException(`Password must be at most 255 characters long`);
    }

    const newUser = new this.userModel({ username, password: await this.hashPassword(password) });
    return newUser.save();
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, passwordHashed: string): Promise<boolean> {
    return await bcrypt.compare(password, passwordHashed);
  }

  async getList(page: number = 0, limit: number = 10): Promise<UserItemResDto[]> {
    const list = await this.userModel
      .find()
      .skip(page * limit)
      .limit(limit)
      .exec();

    return list.map((item) => {
      return { id: item._id.toString(), username: item.username };
    });
  }
}
