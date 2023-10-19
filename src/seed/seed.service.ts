import { Injectable } from '@nestjs/common';
import { ProductsService } from './../products/products.service';
import { initialData } from './data/seed-data';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';


@Injectable()
export class SeedService {

  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async runSeed() {

    await this.deleteTables();
    
    const adminUser = await this.insertUsers();

    await this.insertNewProducts(adminUser);
    
    return 'seed executed';
  }

  private async deleteTables() {
    await this.productService.deleteAllProducts();

    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();

  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];

    seedUsers.forEach( user => {
      users.push(this.userRepository.create({...user, password: bcrypt.hashSync(user.password, 10)}))
    });

    const dBUsers = await this.userRepository.save(users);

    return dBUsers[0];
  }

  private async insertNewProducts(user: User) {
    const products = initialData.products;
    const insertPromise = [];
    products.forEach(product => {
      insertPromise.push(this.productService.create(product, user));
    });
    await Promise.all(insertPromise);
    return true;
  }
}
