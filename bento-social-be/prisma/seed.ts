import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Sample data arrays
const firstNames = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
  'Kate',
  'Liam',
  'Mia',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Rachel',
  'Sam',
  'Tina',
  'Uma',
  'Victor',
  'Wendy',
  'Xavier',
  'Yara',
  'Zoe',
];

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
];

const topics = [
  { name: 'Technology', color: '#3B82F6' },
  { name: 'Science', color: '#10B981' },
  { name: 'Art', color: '#8B5CF6' },
  { name: 'Music', color: '#EC4899' },
  { name: 'Travel', color: '#F59E0B' },
  { name: 'Food', color: '#EF4444' },
  { name: 'Sports', color: '#06B6D4' },
  { name: 'Fashion', color: '#F97316' },
  { name: 'Photography', color: '#6366F1' },
  { name: 'Gaming', color: '#14B8A6' },
];

const postContents = [
  'Just finished reading an amazing book about distributed systems! The concepts are fascinating.',
  'Beautiful sunset today 🌅 Nature never fails to amaze me.',
  'Working on a new project. Excited to share it with everyone soon!',
  'Coffee and code - the perfect combination ☕',
  'Had an incredible conversation with a fellow developer today. Learning never stops!',
  "Just discovered a new framework. Can't wait to dive deeper into it.",
  'Weekend vibes: coding, reading, and relaxing. Perfect balance!',
  'The future of web development looks bright. So many exciting technologies emerging.',
  'Sharing some thoughts on software architecture. What are your favorite patterns?',
  'Just launched a new feature! Feedback is always welcome.',
  'Morning run completed. Starting the day with energy! 🏃',
  'Deep dive into TypeScript advanced types today. Mind-blowing stuff!',
  'Collaboration is key in software development. Grateful for my team!',
  'Reflecting on the importance of clean code. It makes all the difference.',
  'New learning: understanding how databases work under the hood.',
];

const commentContents = [
  'Great post! Thanks for sharing.',
  'I totally agree with this!',
  "Interesting perspective. I hadn't thought about it that way.",
  'This is exactly what I needed to read today.',
  'Could you elaborate more on this point?',
  'Amazing work! Keep it up.',
  'I have a different view on this, but I respect your opinion.',
  'This helped me understand the concept better. Thank you!',
  'Looking forward to more content like this.',
  'Well said! This resonates with me.',
];

async function hashPassword(
  password: string,
): Promise<{ password: string; salt: string }> {
  const salt = bcrypt.genSaltSync(8);
  const hashPassword = await bcrypt.hash(`${password}.${salt}`, 10);
  return { password: hashPassword, salt };
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.commentLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.postSave.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.follower.deleteMany();
  await prisma.post.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();

  // Create Topics
  console.log('📚 Creating topics...');
  const createdTopics = [];
  for (const topic of topics) {
    const created = await prisma.topic.create({
      data: {
        id: uuidv4(),
        name: topic.name,
        color: topic.color,
        postCount: 0,
      },
    });
    createdTopics.push(created);
  }
  console.log(`✅ Created ${createdTopics.length} topics`);

  // Create Users
  console.log('👥 Creating users...');
  const createdUsers = [];
  const defaultPassword = 'password123';
  const { password: hashedPassword, salt } =
    await hashPassword(defaultPassword);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      salt: salt,
      role: 'admin',
      status: 'active',
      bio: 'System Administrator',
      followerCount: 0,
      postCount: 0,
    },
  });
  createdUsers.push(adminUser);

  // Create regular users
  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;
    const { password: pwd, salt: s } = await hashPassword(defaultPassword);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        username: username,
        firstName: firstName,
        lastName: lastName,
        password: pwd,
        salt: s,
        role: 'user',
        status: i < 18 ? 'active' : i === 18 ? 'pending' : 'inactive',
        bio: `Hi, I'm ${firstName}! ${i % 3 === 0 ? 'Love coding and technology.' : i % 3 === 1 ? 'Passionate about learning new things.' : 'Always exploring new ideas.'}`,
        websiteUrl: i % 4 === 0 ? `https://${username}.com` : null,
        avatar: i % 5 === 0 ? `https://i.pravatar.cc/150?img=${i + 1}` : null,
        cover: i % 7 === 0 ? `https://picsum.photos/800/300?random=${i}` : null,
        followerCount: 0,
        postCount: 0,
      },
    });
    createdUsers.push(user);
  }
  console.log(`✅ Created ${createdUsers.length} users`);

  // Create Posts
  console.log('📝 Creating posts...');
  const createdPosts = [];
  for (let i = 0; i < 50; i++) {
    const author =
      createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const topic =
      createdTopics[Math.floor(Math.random() * createdTopics.length)];
    const content =
      postContents[Math.floor(Math.random() * postContents.length)];
    const isFeatured = i < 5;
    const postType = i % 3 === 0 ? 'media' : 'text';

    const post = await prisma.post.create({
      data: {
        id: uuidv4(),
        content: content,
        image:
          postType === 'media'
            ? `https://picsum.photos/800/600?random=${i}`
            : null,
        authorId: author.id,
        topicId: topic.id,
        isFeatured: isFeatured,
        type: postType,
        commentCount: 0,
        likedCount: 0,
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ), // Random date within last 30 days
      },
    });
    createdPosts.push(post);

    // Update user post count
    await prisma.user.update({
      where: { id: author.id },
      data: { postCount: { increment: 1 } },
    });

    // Update topic post count
    await prisma.topic.update({
      where: { id: topic.id },
      data: { postCount: { increment: 1 } },
    });
  }
  console.log(`✅ Created ${createdPosts.length} posts`);

  // Create Comments
  console.log('💬 Creating comments...');
  const createdComments: Array<{ id: string }> = [];
  for (let i = 0; i < 100; i++) {
    const post = createdPosts[Math.floor(Math.random() * createdPosts.length)];
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const content =
      commentContents[Math.floor(Math.random() * commentContents.length)];
    const parentId: string | null =
      i > 20 && Math.random() > 0.7
        ? (createdComments[Math.floor(Math.random() * createdComments.length)]
            ?.id ?? null)
        : null;
    const status = Math.random() > 0.1 ? 'approved' : 'pending';

    const comment = await prisma.comment.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        postId: post.id,
        parentId: parentId,
        content: content,
        status: status,
        likedCount: 0,
        replyCount: 0,
        createdAt: new Date(
          Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000,
        ),
      },
    });
    createdComments.push(comment);

    // Update post comment count
    await prisma.post.update({
      where: { id: post.id },
      data: { commentCount: { increment: 1 } },
    });

    // Update parent comment reply count if exists
    if (parentId) {
      await prisma.comment.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } },
      });
    }
  }
  console.log(`✅ Created ${createdComments.length} comments`);

  // Create Followers
  console.log('👫 Creating followers...');
  let followerCount = 0;
  for (let i = 0; i < 60; i++) {
    const follower =
      createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const following =
      createdUsers[Math.floor(Math.random() * createdUsers.length)];

    if (follower.id !== following.id) {
      try {
        await prisma.follower.create({
          data: {
            followerId: follower.id,
            followingId: following.id,
            createdAt: new Date(
              Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000,
            ),
          },
        });

        // Update follower count
        await prisma.user.update({
          where: { id: following.id },
          data: { followerCount: { increment: 1 } },
        });
        followerCount++;
      } catch (e) {
        // Ignore duplicate key errors
      }
    }
  }
  console.log(`✅ Created ${followerCount} follower relationships`);

  // Create Post Likes
  console.log('❤️ Creating post likes...');
  let postLikeCount = 0;
  for (let i = 0; i < 150; i++) {
    const post = createdPosts[Math.floor(Math.random() * createdPosts.length)];
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];

    try {
      await prisma.postLike.create({
        data: {
          postId: post.id,
          userId: user.id,
          createdAt: new Date(
            Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      // Update post like count
      await prisma.post.update({
        where: { id: post.id },
        data: { likedCount: { increment: 1 } },
      });
      postLikeCount++;
    } catch (e) {
      // Ignore duplicate key errors
    }
  }
  console.log(`✅ Created ${postLikeCount} post likes`);

  // Create Comment Likes
  console.log('👍 Creating comment likes...');
  let commentLikeCount = 0;
  for (let i = 0; i < 80; i++) {
    const comment =
      createdComments[Math.floor(Math.random() * createdComments.length)];
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];

    try {
      await prisma.commentLike.create({
        data: {
          commentId: comment.id,
          userId: user.id,
          createdAt: new Date(
            Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      // Update comment like count
      await prisma.comment.update({
        where: { id: comment.id },
        data: { likedCount: { increment: 1 } },
      });
      commentLikeCount++;
    } catch (e) {
      // Ignore duplicate key errors
    }
  }
  console.log(`✅ Created ${commentLikeCount} comment likes`);

  // Create Post Saves
  console.log('🔖 Creating post saves...');
  let postSaveCount = 0;
  for (let i = 0; i < 40; i++) {
    const post = createdPosts[Math.floor(Math.random() * createdPosts.length)];
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];

    try {
      await prisma.postSave.create({
        data: {
          postId: post.id,
          userId: user.id,
          createdAt: new Date(
            Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000,
          ),
        },
      });
      postSaveCount++;
    } catch (e) {
      // Ignore duplicate key errors
    }
  }
  console.log(`✅ Created ${postSaveCount} post saves`);

  // Create Notifications
  console.log('🔔 Creating notifications...');
  const notificationActions = ['liked', 'followed', 'replied'];
  for (let i = 0; i < 50; i++) {
    const receiver =
      createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const actor = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const action = notificationActions[
      Math.floor(Math.random() * notificationActions.length)
    ] as 'liked' | 'followed' | 'replied';

    if (receiver.id !== actor.id) {
      let content = '';
      if (action === 'liked') {
        content = `${actor.firstName} ${actor.lastName} liked your post`;
      } else if (action === 'followed') {
        content = `${actor.firstName} ${actor.lastName} started following you`;
      } else if (action === 'replied') {
        content = `${actor.firstName} ${actor.lastName} replied to your comment`;
      }

      await prisma.notification.create({
        data: {
          id: uuidv4(),
          receiverId: receiver.id,
          actorId: actor.id,
          content: content,
          action: action,
          isSent: Math.random() > 0.3,
          isRead: Math.random() > 0.5,
          createdAt: new Date(
            Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000,
          ),
        },
      });
    }
  }
  console.log(`✅ Created 50 notifications`);

  console.log('✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${createdTopics.length} topics`);
  console.log(
    `   - ${createdUsers.length} users (1 admin, ${createdUsers.length - 1} regular)`,
  );
  console.log(`   - ${createdPosts.length} posts`);
  console.log(`   - ${createdComments.length} comments`);
  console.log(`   - ${followerCount} follower relationships`);
  console.log(`   - ${postLikeCount} post likes`);
  console.log(`   - ${commentLikeCount} comment likes`);
  console.log(`   - ${postSaveCount} post saves`);
  console.log(`   - 50 notifications`);
  console.log('\n🔑 Default password for all users: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

