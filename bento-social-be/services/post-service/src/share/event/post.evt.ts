import { AppEvent } from '../data-model';

interface PostCreatedPayload {
  postId: string;
  topicId: string;
}

interface PostDeletedPayload {
  postId: string;
  topicId: string;
}

export class PostCreatedEvent extends AppEvent<PostCreatedPayload> {
  static readonly EVENT_NAME = 'post.created';

  private constructor(payload: PostCreatedPayload, senderId?: string) {
    super(PostCreatedEvent.EVENT_NAME, payload, { senderId });
  }

  static create(
    payload: PostCreatedPayload,
    senderId?: string,
  ): PostCreatedEvent {
    return new PostCreatedEvent(payload, senderId);
  }
}

export class PostDeletedEvent extends AppEvent<PostDeletedPayload> {
  static readonly EVENT_NAME = 'post.deleted';

  private constructor(payload: PostDeletedPayload, senderId?: string) {
    super(PostDeletedEvent.EVENT_NAME, payload, { senderId });
  }

  static create(
    payload: PostDeletedPayload,
    senderId?: string,
  ): PostDeletedEvent {
    return new PostDeletedEvent(payload, senderId);
  }
}
