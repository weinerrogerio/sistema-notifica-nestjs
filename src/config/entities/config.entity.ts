import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('config')
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  SMTP_HOST: string;

  @Column({ nullable: true })
  SMTP_PORT: number;

  @Column({ nullable: true })
  SMTP_USER: string;

  @Column({ nullable: true })
  SMTP_PASS: string;

  @Column({ nullable: true })
  SMTP_FROM: string;

  @Column({ nullable: true })
  EXTERNAL_SERVICE_API_KEY: string;

  @Column({ nullable: true })
  EXTERNAL_SERVICE_SENDER_EMAIL: string;
}
