import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('daily_activity_categories')
export class DailyActivityCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    unique: true,
    length: 100,
  })
  name!: string;

  @Column({
    nullable: true,
    length: 255,
  })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
