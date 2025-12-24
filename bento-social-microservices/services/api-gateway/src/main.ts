import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

import 'dotenv/config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bodyParser: false, // Disable default body parser
	});

	// Disable body parsing for multipart/form-data (file uploads)
	// This allows raw request streaming to upstream services
	const rawBodyBuffer = (req: any, res: any, buf: Buffer, encoding: string) => {
		if (buf && buf.length) {
			req.rawBody = buf;
		}
	};

	app.use(bodyParser.json({ verify: rawBodyBuffer, limit: '10mb' }));
	app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true, limit: '10mb' }));

	app.enableCors({
		origin: process.env.FRONTEND_URL || '*',
		credentials: true,
	});

	const port = process.env.PORT ?? 3000;
	await app.listen(port);

	Logger.log(
		`🚀 API Gateway is running on: http://localhost:${port}`,
		'Bootstrap'
	);
	Logger.log(`📡 Proxying requests to microservices...`, 'Bootstrap');
}

bootstrap();
