import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenPayload } from '@bento/shared';
import { ITokenProvider } from './auth.port';

@Injectable()
export class JwtTokenService implements ITokenProvider {
	constructor(
		private readonly secretKey: string,
		private readonly expiresIn: string | number
	) {}

	async generateToken(payload: TokenPayload): Promise<string> {
		// @ts-ignore
		return jwt.sign(payload, this.secretKey as string, {
			expiresIn: this.expiresIn,
		});
	}

	async verifyToken(token: string): Promise<TokenPayload | null> {
		try {
			const decoded = jwt.verify(
				token,
				this.secretKey
			) as TokenPayload;
			return decoded;
		} catch {
			return null;
		}
	}
}
