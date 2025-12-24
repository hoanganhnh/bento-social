import { Topic, CreateTopicDTO, UpdateTopicDTO } from './topic.model';

export interface ITopicService {
  create(dto: CreateTopicDTO): Promise<string>;
  update(id: string, dto: UpdateTopicDTO): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  increasePostCount(id: string, step: number): Promise<void>;
  decreasePostCount(id: string, step: number): Promise<void>;
}

export interface ITopicRepository {
  get(id: string): Promise<Topic | null>;
  findAll(): Promise<Topic[]>;
  findByName(name: string): Promise<Topic | null>;
  insert(topic: Topic): Promise<void>;
  update(id: string, dto: UpdateTopicDTO): Promise<void>;
  delete(id: string): Promise<void>;
  increaseCount(id: string, field: string, step: number): Promise<void>;
  decreaseCount(id: string, field: string, step: number): Promise<void>;
}
