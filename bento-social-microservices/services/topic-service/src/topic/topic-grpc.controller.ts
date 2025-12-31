import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ITopicRepository } from "./topic.port";
import { TOPIC_REPOSITORY } from "./topic.di-token";
import { Topic } from "./topic.model";

@Controller()
export class TopicGrpcController {
  constructor(
    @Inject(TOPIC_REPOSITORY)
    private readonly topicRepository: ITopicRepository,
  ) {}

  @GrpcMethod("TopicService", "FindById")
  async findById(data: { id: string }): Promise<any> {
    const topic = await this.topicRepository.get(data.id);

    if (!topic) {
      return {
        id: "",
        name: "",
        color: "",
        postCount: 0,
        status: "",
      };
    }

    return this._toGrpcTopic(topic);
  }

  @GrpcMethod("TopicService", "FindByIds")
  async findByIds(data: { ids: string[] }): Promise<{ topics: any[] }> {
    if (!data.ids || !Array.isArray(data.ids) || data.ids.length === 0) {
      return { topics: [] };
    }

    const topics = await this.topicRepository.listByIds(data.ids);
    return {
      topics: topics.map((topic) => this._toGrpcTopic(topic)),
    };
  }

  private _toGrpcTopic(topic: Topic): any {
    return {
      id: topic.id,
      name: topic.name,
      color: topic.color,
      postCount: topic.postCount || 0,
      status: topic.status,
    };
  }
}
