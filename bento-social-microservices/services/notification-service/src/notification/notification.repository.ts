import { Injectable } from '@nestjs/common';
import { PagingDTO } from '@bento/shared';
import { PrismaService } from '../prisma/prisma.service';
import { INotificationRepository, NotiPaginated } from './notification.port';
import {
  Notification,
  NotificationAction,
  NotificationCondition,
  NotificationUpdateDTO,
} from './notification.model';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insert(data: Notification): Promise<boolean> {
    await this.prisma.notification.create({
      data: {
        id: data.id,
        receiverId: data.receiverId,
        actorId: data.actorId,
        content: data.content,
        action: data.action,
        isSent: data.isSent,
        isRead: data.isRead,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
    return true;
  }

  async update(id: string, dto: NotificationUpdateDTO): Promise<boolean> {
    await this.prisma.notification.update({
      where: { id },
      data: dto,
    });
    return true;
  }

  async get(id: string): Promise<Notification | null> {
    const noti = await this.prisma.notification.findUnique({ where: { id } });
    if (!noti) return null;

    return {
      id: noti.id,
      receiverId: noti.receiverId,
      actorId: noti.actorId ?? '',
      content: noti.content ?? '',
      action: noti.action as NotificationAction,
      isSent: noti.isSent ?? false,
      isRead: noti.isRead ?? false,
      createdAt: noti.createdAt,
      updatedAt: noti.updatedAt!,
    };
  }

  async list(cond: NotificationCondition, paging: PagingDTO): Promise<NotiPaginated> {
    const offset = (paging.page - 1) * paging.limit;
    const count = await this.prisma.notification.count({ where: cond });

    const unreadCount = await this.prisma.notification.count({
      where: { ...cond, isRead: false },
    });

    const result = await this.prisma.notification.findMany({
      where: cond,
      orderBy: { id: 'desc' },
      skip: offset,
      take: paging.limit,
    });

    return {
      data: result.map((noti) => ({
        id: noti.id,
        receiverId: noti.receiverId,
        actorId: noti.actorId ?? '',
        content: noti.content ?? '',
        action: noti.action as NotificationAction,
        isSent: noti.isSent ?? false,
        isRead: noti.isRead ?? false,
        createdAt: noti.createdAt,
        updatedAt: noti.updatedAt!,
      })),
      paging,
      total: count,
      unreadCount,
    };
  }

  async readAll(receiverId: string): Promise<boolean> {
    await this.prisma.notification.updateMany({
      where: { receiverId },
      data: { isRead: true },
    });
    return true;
  }
}

