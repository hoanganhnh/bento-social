import axios from 'axios';
import { IPostQueryRpc } from './post-like.port';

export class PostQueryRpc implements IPostQueryRpc {
  constructor(private readonly postServiceUrl: string) {}

  async existed(postId: string): Promise<boolean> {
    try {
      const { status } = await axios.get(`${this.postServiceUrl}/posts/rpc/posts/${postId}`);
      return status === 200;
    } catch (error) {
      return false;
    }
  }
}


