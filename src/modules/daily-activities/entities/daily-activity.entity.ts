import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DailyActivityCategory } from '../../daily-activity-categories/entities/daily-activity-category.entity';

import { User } from '../../users/entities/user.entity';

@Entity('daily_activities')
export class DailyActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'date',
  })
  activityDate!: Date;

  @ManyToOne(() => DailyActivityCategory, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  category!: DailyActivityCategory;

  @Column({
    length: 150,
  })
  location!: string;

  @Column({
    length: 255,
  })
  activity!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  details?: string;

  @ManyToOne(() => User, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  recordedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
