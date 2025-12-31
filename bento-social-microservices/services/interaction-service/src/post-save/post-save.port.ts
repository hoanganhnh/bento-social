import { Paginated, PagingDTO, Topic } from '@bento/shared';
import { ActionDTO, PostSave } from './post-save.model';

export interface IPostSaveService {
  save(dto: ActionDTO): Promise<boolean>;
  unsave(dto: ActionDTO): Promise<boolean>;
}

export interface IPostSaveRepository {
  get(data: ActionDTO): Promise<PostSave | null>;
  insert(data: PostSave): Promise<boolean>;
  delete(data: ActionDTO): Promise<boolean>;
  list(userId: string, paging: PagingDTO): Promise<Paginated<PostSave>>;
  listPostIdsSaved(userId: string, postIds: string[]): Promise<string[]>;
}

export interface ITopicQueryRpc {
  findByIds(ids: string[]): Promise<Array<Topic>>;
}


