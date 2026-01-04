import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async createUser(
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    middleName?: string,
  ): Promise<boolean> {
    try {
      const exists = await this.usersRepository.findOneBy({
        username,
      });
      if (exists) {
        return false;
      }

      const hashedPassword: string = await bcrypt.hash(password, 10);

      const user: User = this.usersRepository.create({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        middleName,
        phoneNumber,
      });

      await this.usersRepository.save(user);

      return true;
    } catch (error) {
      console.log('returning false: ', error);
      return false;
    }
  }
}
