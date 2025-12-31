import { Requester, Paginated } from '@bento/shared';
import { CreateTopicDTO, UpdateTopicDTO, TopicQueryDTO, TopicCondDTO } from './topic.dto';
import { Topic, PublicTopic } from './topic.model';

export interface ITopicService {
  // Queries
  getTopic(id: string): Promise<PublicTopic | null>;
  listTopics(query: TopicQueryDTO): Promise<Paginated<PublicTopic>>;
  
  // Commands (Admin only)
  createTopic(requester: Requester, dto: CreateTopicDTO): Promise<string>;
  updateTopic(requester: Requester, topicId: string, dto: UpdateTopicDTO): Promise<void>;
  deleteTopic(requester: Requester, topicId: string): Promise<void>;
  
  // Event handlers
  incrementPostCount(topicId: string): Promise<void>;
  decrementPostCount(topicId: string): Promise<void>;
}

export interface ITopicRepository {
  // Query
  get(id: string): Promise<Topic | null>;
  findByCond(cond: TopicCondDTO): Promise<Topic | null>;
  listByIds(ids: string[]): Promise<Topic[]>;
  list(query: TopicQueryDTO): Promise<{ topics: Topic[]; total: number }>;
  
  // Command
  insert(topic: Topic): Promise<void>;
  update(id: string, dto: UpdateTopicDTO): Promise<void>;
  delete(id: string, isHard: boolean): Promise<void>;
  
  // Counters
  incrementPostCount(id: string): Promise<void>;
  decrementPostCount(id: string): Promise<void>;
}

