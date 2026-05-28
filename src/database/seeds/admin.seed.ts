import { DataSource } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from '../../modules/users/entities/user.entity';

import { UserRole } from '../../common/enums/role.enum';

export async function seedAdmin(dataSource: DataSource) {
  const usersRepository = dataSource.getRepository(User);

  const existingAdmin = await usersRepository.findOne({
    where: {
      email: process.env.SEED_ADMIN_EMAIL,
    },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');

    return;
  }

  const hashedPassword = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD!,
    10,
  );

  const admin = usersRepository.create({
    fullName: process.env.SEED_ADMIN_NAME,
    email: process.env.SEED_ADMIN_EMAIL,

    password: hashedPassword,

    role: UserRole.SUPER_ADMIN,

    isActive: true,
  });

  await usersRepository.save(admin);

  console.log('Admin user seeded successfully');
}
