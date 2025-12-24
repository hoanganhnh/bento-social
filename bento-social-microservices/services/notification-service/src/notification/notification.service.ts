import { Inject, Injectable } from '@nestjs/common';
import { v7 } from 'uuid';
import {
  ErrForbidden,
  ErrNotFound,
  IAuthorRpc,
  PagingDTO,
  PublicUser,
  Requester,
  USER_RPC,
} from '@bento/shared';
import { NOTI_REPOSITORY } from './notification.di-token';
import {
  Notification,
  NotificationCondition,
  notificationCondSchema,
  NotificationCreateDTO,
  notificationCreateDTOSchema,
} from './notification.model';
import { INotificationRepository, INotificationService, NotiPaginated } from './notification.port';

@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @Inject(NOTI_REPOSITORY) private readonly repository: INotificationRepository,
    @Inject(USER_RPC) private readonly userRpc: IAuthorRpc,
  ) {}

  async create(dto: NotificationCreateDTO): Promise<string> {
    const data = notificationCreateDTOSchema.parse(dto);
    const newId = v7();

    const newData: Notification = {
      ...data,
      id: newId,
      isSent: false,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.insert(newData);
    return newId;
  }

  async read(id: string, requester: Requester): Promise<boolean> {
    const receiverId = requester.sub;

    const noti = await this.repository.get(id);

    if (!noti) throw ErrNotFound;
    if (noti.receiverId !== receiverId) throw ErrForbidden;

    await this.repository.update(id, { isRead: true });
    return true;
  }

  async readAll(requester: Requester): Promise<boolean> {
    const receiverId = requester.sub;
    await this.repository.readAll(receiverId);
    return true;
  }

  async list(cond: NotificationCondition, paging: PagingDTO): Promise<NotiPaginated> {
    const condition = notificationCondSchema.parse(cond);

    const result = await this.repository.list(condition, paging);

    const userIds = result.data.map((noti) => noti.actorId);
    const users = await this.userRpc.findByIds(userIds);

    const userMap = new Map<string, PublicUser>();
    users.forEach((user) => userMap.set(user.id, user));

    result.data.forEach((noti) => {
      noti.sender = userMap.get(noti.actorId);
    });

    return result;
  }
}

