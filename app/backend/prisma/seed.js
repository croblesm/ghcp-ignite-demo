const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate random author names
function generateAuthorName(index) {
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
    'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
    'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
    'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
    'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah'];

  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

  return `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`;
}

async function main() {
  console.log('Seeding database with ENORMOUS dataset...');
  console.log('WARNING: This will create 500 authors, 10,000 posts, 50,000+ comments, and many tags');
  console.log('This intentionally creates an EXTREME N+1 query problem for demonstration purposes\n');
  console.log('This will take several minutes to complete...\n');

  // Create 500 authors
  console.log('Creating 500 authors...');
  const authors = [];
  for (let i = 0; i < 500; i++) {
    const author = await prisma.author.create({
      data: {
        name: generateAuthorName(i),
        email: `user${i}@example.com`,
        bio: `I'm a passionate writer and developer. I love sharing my knowledge about technology, programming, and software development. I have ${Math.floor(Math.random() * 15) + 1} years of experience in the industry.`,
      },
    });
    authors.push(author);
    if ((i + 1) % 50 === 0) {
      console.log(`  Created ${i + 1} authors...`);
    }
  }

  console.log(`✓ Created ${authors.length} authors`);

  // Create tags
  console.log('\nCreating tags...');
  const tagNames = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Database', 'Performance',
    'Security', 'API', 'Frontend', 'Backend', 'DevOps', 'Testing', 'Architecture', 'Best Practices',
    'Tutorial', 'Guide', 'Tips', 'Advanced', 'Beginner'];

  const tags = [];
  for (const tagName of tagNames) {
    const tag = await prisma.tag.create({
      data: { name: tagName },
    });
    tags.push(tag);
  }
  console.log(`✓ Created ${tags.length} tags`);

  // Create 10,000 posts - this will create an EXTREME N+1 problem!
  console.log('\nCreating 10,000 posts...');
  const postTopics = [
    'Introduction to', 'Getting Started with', 'Advanced', 'Understanding', 'Mastering',
    'Best Practices for', 'Common Pitfalls in', 'Debugging', 'Optimizing', 'Building with',
    'Complete Guide to', 'Deep Dive into', 'Exploring', 'Tips for', 'Patterns in',
    'Fundamentals of', 'Professional', 'Modern Approaches to', 'Scaling', 'Implementing',
    'Architecting', 'Troubleshooting', 'Securing', 'Deploying', 'Monitoring',
    'Testing Strategies for', 'Performance Tuning', 'Migrating to', 'Comparing', 'Choosing'
  ];

  const postSubjects = [
    'Node.js', 'React', 'JavaScript', 'TypeScript', 'SQL Server', 'Prisma ORM', 'Express',
    'REST APIs', 'GraphQL', 'Database Design', 'Authentication', 'Authorization', 'Microservices',
    'Web Security', 'Performance Optimization', 'Async Programming', 'Error Handling', 'Testing',
    'CI/CD', 'Docker', 'Kubernetes', 'Cloud Computing', 'Serverless', 'Web APIs', 'Frontend',
    'Backend', 'Full Stack Development', 'Code Quality', 'Refactoring', 'Design Patterns',
    'Data Structures', 'Algorithms', 'System Design', 'Scalability', 'Vue.js', 'Angular',
    'Next.js', 'Nest.js', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'RabbitMQ',
    'Kafka', 'gRPC', 'WebSockets', 'OAuth', 'SAML', 'OpenID Connect', 'Load Balancing',
    'Caching Strategies', 'Message Queues', 'Event Sourcing', 'CQRS', 'DDD', 'TDD', 'BDD',
    'API Gateways', 'Service Mesh', 'Observability', 'Distributed Tracing', 'Logging',
    'Metrics', 'Alerting', 'Incident Response', 'SRE', 'DevOps Culture', 'GitOps',
    'Infrastructure as Code', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'CircleCI',
    'AWS', 'Azure', 'GCP', 'Lambda Functions', 'EC2', 'S3', 'CloudFront', 'Route53',
    'ECS', 'EKS', 'Fargate', 'DynamoDB', 'Aurora', 'RDS', 'ElastiCache', 'SQS', 'SNS'
  ];

  const posts = [];
  for (let i = 0; i < 10000; i++) {
    const author = authors[Math.floor(Math.random() * authors.length)];
    const topic = postTopics[Math.floor(Math.random() * postTopics.length)];
    const subject = postSubjects[Math.floor(Math.random() * postSubjects.length)];
    const title = `${topic} ${subject}`;

    // Create post with random tags
    const randomTags = [];
    const numTags = Math.floor(Math.random() * 4) + 1; // 1-4 tags per post
    for (let j = 0; j < numTags; j++) {
      const randomTag = tags[Math.floor(Math.random() * tags.length)];
      if (!randomTags.find(t => t.id === randomTag.id)) {
        randomTags.push(randomTag);
      }
    }

    const post = await prisma.post.create({
      data: {
        title: title,
        content: `This is an in-depth article about ${subject}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nThis article covers important concepts, best practices, and real-world examples that will help you master ${subject}. We'll explore various techniques and strategies used by professional developers.`,
        authorId: author.id,
        tags: {
          create: randomTags.map(tag => ({
            tagId: tag.id,
          })),
        },
      },
    });
    posts.push(post);

    if ((i + 1) % 1000 === 0) {
      console.log(`  Created ${i + 1} posts...`);
    }
  }

  console.log(`✓ Created ${posts.length} posts`);

  // Create lots of comments (5-7 per post = 50,000-70,000 comments) in multiple languages
  console.log('\nCreating comments in multiple languages (this will take a while)...');

  const commentTemplates = [
    // English
    `Great article! This really helped me understand {title}. Thanks for sharing this valuable information.`,
    `Excellent post about {title}. Very informative and well-written!`,
    `This is exactly what I was looking for regarding {title}. Thank you!`,
    `Amazing insights on {title}. Looking forward to more content like this.`,
    `Very helpful article about {title}. Bookmarked for future reference!`,

    // Spanish
    `¡Excelente artículo sobre {title}! Muy útil e informativo.`,
    `Gracias por compartir esta información valiosa sobre {title}.`,
    `Me ayudó mucho a entender {title}. ¡Buen trabajo!`,

    // French
    `Excellent article sur {title}! Très bien écrit et informatif.`,
    `Merci beaucoup pour ce contenu précieux concernant {title}.`,
    `C'est exactement ce que je cherchais à propos de {title}!`,

    // German
    `Großartiger Artikel über {title}! Sehr hilfreich und informativ.`,
    `Vielen Dank für diese wertvollen Informationen zu {title}.`,
    `Genau das habe ich zum Thema {title} gesucht!`,

    // Portuguese
    `Excelente artigo sobre {title}! Muito útil e bem escrito.`,
    `Obrigado por compartilhar essas informações valiosas sobre {title}.`,
    `Isso me ajudou muito a entender {title}. Ótimo trabalho!`,

    // Italian
    `Ottimo articolo su {title}! Molto utile e ben scritto.`,
    `Grazie per aver condiviso queste preziose informazioni su {title}.`,
    `Questo mi ha davvero aiutato a capire {title}!`,

    // Japanese
    `{title}についての素晴らしい記事です！とても役に立ちました。`,
    `{title}に関する貴重な情報をありがとうございます。`,

    // Chinese
    `关于{title}的优秀文章！非常有用和信息丰富。`,
    `感谢分享关于{title}的宝贵信息。`,

    // Russian
    `Отличная статья о {title}! Очень полезно и информативно.`,
    `Спасибо за ценную информацию о {title}.`,
  ];

  let commentCount = 0;
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const numComments = Math.floor(Math.random() * 3) + 5; // 5-7 comments per post

    for (let j = 0; j < numComments; j++) {
      const commentAuthor = authors[Math.floor(Math.random() * authors.length)];
      const template = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
      const content = template.replace('{title}', post.title);

      await prisma.comment.create({
        data: {
          content: content,
          postId: post.id,
          authorId: commentAuthor.id,
        },
      });
      commentCount++;
    }

    if ((i + 1) % 1000 === 0) {
      console.log(`  Created comments for ${i + 1} posts...`);
    }
  }

  console.log(`✓ Created ${commentCount} comments`);
  console.log('\n========================================');
  console.log('Seeding complete!');
  console.log('========================================');
  console.log(`Total Authors: ${authors.length}`);
  console.log(`Total Posts: ${posts.length}`);
  console.log(`Total Comments: ${commentCount}`);
  console.log(`Total Tags: ${tags.length}`);
  console.log('\nThis ENORMOUS dataset will demonstrate EXTREME N+1 query problems!');
  console.log('Expected: ~70,000+ database queries when fetching all posts!');
  console.log('This will be EXTREMELY SLOW!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
