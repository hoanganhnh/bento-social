import { Paginated, PagingDTO } from 'src/share/data-model';
import { Requester } from 'src/share/interface';
import {
  CreatePostDTO,
  Post,
  PostCondDTO,
  TopicModel,
  UpdatePostDTO,
} from './model';

export interface IPostService {
  create(dto: CreatePostDTO): Promise<string>;
  update(
    id: string,
    dto: UpdatePostDTO,
    requester: Requester,
  ): Promise<boolean>;
  delete(id: string, requester: Requester): Promise<boolean>;
}

export interface IPostRepository
  extends IPostQueryRepository,
    IPostCommandRepository {}

export interface IPostQueryRepository {
  get(id: string): Promise<Post | null>;
  list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>>;
  listByIds(ids: string[]): Promise<Post[]>;
}

export interface IPostCommandRepository {
  insert(dto: Post): Promise<void>;
  update(id: string, dto: UpdatePostDTO): Promise<void>;
  delete(id: string): Promise<void>;
  increaseCount(id: string, field: string, step: number): Promise<void>;
  decreaseCount(id: string, field: string, step: number): Promise<void>;
}

export interface ITopicQueryRPC {
  findById(id: string): Promise<TopicModel | null>;
  findByIds(ids: string[]): Promise<Array<TopicModel>>;
}
