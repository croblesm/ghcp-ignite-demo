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

// Helper to generate diverse email addresses
function generateEmail(index, name) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'protonmail.com', 'mail.com', 'aol.com', 'zoho.com', 'fastmail.com',
    'tutanota.com', 'yandex.com', 'gmx.com', 'inbox.com', 'live.com'];

  const patterns = [
    (n, i) => `${n.replace(' ', '.').toLowerCase()}${i}@${domains[i % domains.length]}`,
    (n, i) => `${n.replace(' ', '_').toLowerCase()}@${domains[i % domains.length]}`,
    (n, i) => `${n.split(' ')[0].toLowerCase()}.${n.split(' ')[1].toLowerCase()}@${domains[i % domains.length]}`,
    (n, i) => `${n.split(' ')[1].toLowerCase()}${n.split(' ')[0].charAt(0).toLowerCase()}${i}@${domains[i % domains.length]}`,
    (n, i) => `${n.split(' ')[0].toLowerCase()}${i}@${domains[i % domains.length]}`,
  ];

  const pattern = patterns[index % patterns.length];
  return pattern(name, index);
}

async function main() {
  console.log('Seeding database with ENORMOUS DIVERSE dataset...');
  console.log('WARNING: This will create 500 authors, 10,000 posts across ALL topics, 60,000+ comments, and many tags');
  console.log('Topics: Technology, Fashion, Sports, Healthcare, Travel, Food, Entertainment, and more!');
  console.log('This intentionally creates an EXTREME N+1 query problem for demonstration purposes\n');
  console.log('This will take several minutes to complete...\n');

  // Create 500 authors
  console.log('Creating 500 authors...');
  const authors = [];
  for (let i = 0; i < 500; i++) {
    const authorName = generateAuthorName(i);
    const author = await prisma.author.create({
      data: {
        name: authorName,
        email: generateEmail(i, authorName),
        bio: `I'm a passionate writer covering various topics. I love sharing knowledge and insights with my readers.`,
      },
    });
    authors.push(author);
    if ((i + 1) % 50 === 0) {
      console.log(`  Created ${i + 1} authors...`);
    }
  }

  console.log(`✓ Created ${authors.length} authors`);

  // Create diverse tags
  console.log('\nCreating tags...');
  const tagNames = ['Technology', 'Fashion', 'Sports', 'Healthcare', 'Travel', 'Food',
    'Entertainment', 'Fitness', 'Lifestyle', 'Business', 'Education', 'Science',
    'Art', 'Music', 'Movies', 'Gaming', 'Photography', 'Design', 'Finance', 'Real Estate'];

  const tags = [];
  for (const tagName of tagNames) {
    const tag = await prisma.tag.create({
      data: { name: tagName },
    });
    tags.push(tag);
  }
  console.log(`✓ Created ${tags.length} tags`);

  // Create 10,000 posts with DIVERSE topics in MULTIPLE languages!
  console.log('\nCreating 10,000 diverse multilingual posts...');

  // Multilingual post templates
  const postTemplates = [
    // TECHNOLOGY (English)
    { topic: 'Best Smartphones', content: 'Discover the latest flagship smartphones with cutting-edge features and innovative technology.' },
    { topic: 'AI and Machine Learning', content: 'Exploring artificial intelligence and its impact on modern society and business.' },
    { topic: 'Cybersecurity Tips', content: 'Essential practices to protect your digital life from hackers and cyber threats.' },
    { topic: 'Cloud Computing Guide', content: 'Understanding cloud services and how they transform business operations.' },

    // FASHION (English & Spanish)
    { topic: 'Summer Fashion Trends 2024', content: 'The hottest styles and must-have pieces for this summer season.' },
    { topic: 'Tendencias de Moda Primavera', content: 'Las últimas tendencias de moda para la primavera con los mejores diseñadores.' },
    { topic: 'Sustainable Fashion', content: 'Eco-friendly clothing brands making a difference in the fashion industry.' },
    { topic: 'Moda Sostenible y Ecológica', content: 'Marcas de ropa que cuidan el medio ambiente y promueven la sostenibilidad.' },

    // SPORTS (English & Spanish)
    { topic: 'Football Championship Highlights', content: 'Recap of the most exciting moments from this season football championship.' },
    { topic: 'Campeonato de Fútbol Resumen', content: 'Los mejores momentos y jugadas del campeonato de fútbol esta temporada.' },
    { topic: 'Basketball Training Tips', content: 'Professional techniques to improve your basketball skills and performance.' },
    { topic: 'Tennis Grand Slam Analysis', content: 'In-depth analysis of the latest Grand Slam tournament and player performances.' },

    // HEALTHCARE (English & German)
    { topic: 'Mental Health Awareness', content: 'Understanding mental health issues and resources for support and treatment.' },
    { topic: 'Gesundheit und Wellness Tipps', content: 'Praktische Ratschläge für ein gesünderes und ausgeglicheneres Leben.' },
    { topic: 'Nutrition and Diet Plans', content: 'Science-based nutrition advice and meal planning for optimal health.' },
    { topic: 'Medizinische Durchbrüche 2024', content: 'Die neuesten medizinischen Fortschritte und Behandlungsmethoden.' },

    // TRAVEL (English & French)
    { topic: 'Best European Destinations', content: 'Must-visit cities and hidden gems across Europe for your next vacation.' },
    { topic: 'Destinations de Voyage en Asie', content: 'Les meilleures destinations touristiques en Asie pour des vacances inoubliables.' },
    { topic: 'Budget Travel Tips', content: 'How to travel the world on a budget without sacrificing experiences.' },
    { topic: 'Voyages de Luxe et Resorts', content: 'Les meilleurs hôtels de luxe et stations balnéaires du monde.' },

    // FOOD (English, Italian & Japanese)
    { topic: 'Italian Cuisine Recipes', content: 'Authentic Italian recipes from pasta to tiramisu for home cooking.' },
    { topic: 'Ricette della Cucina Italiana', content: 'Le migliori ricette tradizionali italiane per cucinare a casa.' },
    { topic: 'Japanese Sushi Guide', content: 'Everything you need to know about sushi varieties and preparation.' },
    { topic: '日本料理の基本とレシピ', content: '伝統的な日本料理の作り方と美味しいレシピを紹介します。' },
    { topic: 'Healthy Cooking Tips', content: 'Nutritious recipes and cooking methods for a healthier lifestyle.' },

    // ENTERTAINMENT (English & Portuguese)
    { topic: 'Movie Reviews 2024', content: 'Comprehensive reviews of the latest blockbusters and indie films.' },
    { topic: 'Críticas de Filmes e Cinema', content: 'Análises detalhadas dos melhores filmes e lançamentos do cinema.' },
    { topic: 'Music Festival Guide', content: 'The biggest music festivals happening around the world this year.' },
    { topic: 'Festivais de Música no Brasil', content: 'Os maiores festivais de música e shows acontecendo no Brasil.' },

    // FITNESS (English & Spanish)
    { topic: 'Home Workout Routines', content: 'Effective exercises you can do at home without expensive equipment.' },
    { topic: 'Rutinas de Ejercicio en Casa', content: 'Ejercicios efectivos que puedes hacer en casa sin equipo costoso.' },
    { topic: 'Yoga for Beginners', content: 'Introduction to yoga practices and poses for flexibility and wellness.' },
    { topic: 'Entrenamiento de Fuerza', content: 'Guía completa de entrenamiento de fuerza para ganar músculo.' },

    // BUSINESS (English & Chinese)
    { topic: 'Startup Success Stories', content: 'Inspiring stories of entrepreneurs who built successful companies.' },
    { topic: '创业成功案例分析', content: '分析成功创业者的经验和商业策略，帮助新创企业成长。' },
    { topic: 'Marketing Strategies 2024', content: 'Latest digital marketing trends and strategies for business growth.' },
    { topic: '商业战略和管理技巧', content: '现代企业管理的最佳实践和战略规划方法。' },

    // LIFESTYLE (English & French)
    { topic: 'Home Decor Ideas', content: 'Creative interior design tips to transform your living space.' },
    { topic: 'Décoration Intérieure Moderne', content: 'Idées et tendances de décoration pour une maison élégante.' },
    { topic: 'Productivity Hacks', content: 'Life hacks and techniques to boost your productivity and efficiency.' },
    { topic: 'Style de Vie Minimaliste', content: 'Comment adopter un mode de vie minimaliste pour plus de bonheur.' },

    // EDUCATION (English & German)
    { topic: 'Online Learning Platforms', content: 'Best e-learning platforms for professional development and skills.' },
    { topic: 'Bildung und Online-Kurse', content: 'Die besten Online-Lernplattformen für berufliche Weiterbildung.' },
    { topic: 'Language Learning Tips', content: 'Effective methods to learn new languages faster and more efficiently.' },

    // SCIENCE (English & Russian)
    { topic: 'Space Exploration Updates', content: 'Latest discoveries and missions in space exploration and astronomy.' },
    { topic: 'Научные Открытия 2024', content: 'Последние научные достижения и прорывы в различных областях науки.' },
    { topic: 'Climate Change Solutions', content: 'Innovative approaches to combat climate change and protect our planet.' },
  ];

  // Prepare all posts data first
  const postsData = [];
  const postTagsData = [];

  for (let i = 0; i < 10000; i++) {
    const author = authors[Math.floor(Math.random() * authors.length)];
    const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];

    // Add variation to titles
    const prefixes = ['', 'Ultimate Guide to ', 'Top 10 ', 'Best ', 'How to Master ', 'Complete Guide to '];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const title = `${prefix}${template.topic}`;

    postsData.push({
      title: title,
      content: template.content,
      authorId: author.id,
    });

    if ((i + 1) % 1000 === 0) {
      console.log(`  Prepared ${i + 1} posts...`);
    }
  }

  console.log(`\nInserting ${postsData.length} posts in batches...`);

  // Insert posts in batches
  const postBatchSize = 1000;
  const insertedPosts = [];
  for (let i = 0; i < postsData.length; i += postBatchSize) {
    const batch = postsData.slice(i, i + postBatchSize);
    await prisma.post.createMany({
      data: batch,
    });
    console.log(`  Inserted ${Math.min(i + postBatchSize, postsData.length)} / ${postsData.length} posts...`);
  }

  // Fetch all posts to get their IDs
  console.log('\nFetching created posts...');
  const posts = await prisma.post.findMany();
  console.log(`✓ Created ${posts.length} posts`);

  // Create PostTag relationships - simpler approach
  console.log('\nCreating post-tag relationships (this may take a minute)...');
  let tagRelationCount = 0;
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const numTags = Math.floor(Math.random() * 4) + 1; // 1-4 tags per post
    const usedTags = new Set();

    for (let j = 0; j < numTags; j++) {
      const randomTag = tags[Math.floor(Math.random() * tags.length)];
      if (!usedTags.has(randomTag.id)) {
        postTagsData.push({
          postId: post.id,
          tagId: randomTag.id,
        });
        usedTags.add(randomTag.id);
        tagRelationCount++;
      }
    }

    if ((i + 1) % 2000 === 0) {
      console.log(`  Prepared tag relationships for ${i + 1} / ${posts.length} posts...`);
    }
  }

  console.log(`\nInserting ${postTagsData.length} post-tag relationships in batches...`);
  const tagBatchSize = 1000;
  for (let i = 0; i < postTagsData.length; i += tagBatchSize) {
    const batch = postTagsData.slice(i, i + tagBatchSize);
    try {
      await prisma.postTag.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`  Inserted ${Math.min(i + tagBatchSize, postTagsData.length)} / ${postTagsData.length} relationships...`);
    } catch (error) {
      console.log(`  Skipping duplicate batch at ${i}...`);
    }
  }
  console.log(`✓ Created ${tagRelationCount} post-tag relationships`);

  // Create lots of comments (5-7 per post = 50,000-70,000 comments) in multiple languages
  console.log('\nCreating multilingual comments (this will take a while)...');

  const commentTemplates = [
    // English
    `Great article! This really helped me understand {title}. Thanks for sharing!`,
    `Excellent post about {title}. Very informative and well-written!`,
    `This is exactly what I was looking for regarding {title}. Thank you!`,
    `Amazing insights on {title}. Looking forward to more content like this.`,
    `Very helpful article about {title}. Bookmarked for future reference!`,

    // Spanish
    `¡Excelente artículo sobre {title}! Muy útil e informativo.`,
    `Gracias por compartir esta información valiosa sobre {title}.`,
    `Me ayudó mucho a entender {title}. ¡Buen trabajo!`,
    `Información muy interesante sobre {title}. ¡Gracias por compartir!`,

    // French
    `Excellent article sur {title}! Très bien écrit et informatif.`,
    `Merci beaucoup pour ce contenu précieux concernant {title}.`,
    `C'est exactement ce que je cherchais à propos de {title}!`,
    `Très utile! J'ai beaucoup appris sur {title}.`,

    // German
    `Großartiger Artikel über {title}! Sehr hilfreich und informativ.`,
    `Vielen Dank für diese wertvollen Informationen zu {title}.`,
    `Genau das habe ich zum Thema {title} gesucht!`,
    `Super Beitrag zu {title}! Sehr empfehlenswert.`,

    // Portuguese
    `Excelente artigo sobre {title}! Muito útil e bem escrito.`,
    `Obrigado por compartilhar essas informações valiosas sobre {title}.`,
    `Isso me ajudou muito a entender {title}. Ótimo trabalho!`,
    `Conteúdo incrível sobre {title}! Muito obrigado!`,

    // Italian
    `Ottimo articolo su {title}! Molto utile e ben scritto.`,
    `Grazie per aver condiviso queste preziose informazioni su {title}.`,
    `Questo mi ha davvero aiutato a capire {title}!`,
    `Contenuto fantastico su {title}! Grazie mille!`,

    // Japanese
    `{title}についての素晴らしい記事です！とても役に立ちました。`,
    `{title}に関する貴重な情報をありがとうございます。`,
    `{title}について詳しく学べました。感謝します！`,

    // Chinese
    `关于{title}的优秀文章！非常有用和信息丰富。`,
    `感谢分享关于{title}的宝贵信息。`,
    `这篇关于{title}的文章很棒！谢谢分享。`,

    // Russian
    `Отличная статья о {title}! Очень полезно и информативно.`,
    `Спасибо за ценную информацию о {title}.`,
    `Прекрасный материал о {title}! Благодарю за публикацию.`,
  ];

  // Build all comments in memory first, then batch insert
  const allComments = [];
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const numComments = Math.floor(Math.random() * 3) + 5; // 5-7 comments per post

    for (let j = 0; j < numComments; j++) {
      const commentAuthor = authors[Math.floor(Math.random() * authors.length)];
      const template = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
      const content = template.replace('{title}', post.title);

      allComments.push({
        content: content,
        postId: post.id,
        authorId: commentAuthor.id,
      });
    }

    if ((i + 1) % 1000 === 0) {
      console.log(`  Prepared comments for ${i + 1} posts...`);
    }
  }

  console.log(`\nInserting ${allComments.length} comments in batches...`);

  // Insert in batches of 5000 for better performance
  const batchSize = 5000;
  for (let i = 0; i < allComments.length; i += batchSize) {
    const batch = allComments.slice(i, i + batchSize);
    await prisma.comment.createMany({
      data: batch,
    });
    console.log(`  Inserted ${Math.min(i + batchSize, allComments.length)} / ${allComments.length} comments...`);
  }

  const commentCount = allComments.length;

  console.log(`✓ Created ${commentCount} comments`);
  console.log('\n========================================');
  console.log('Seeding complete!');
  console.log('========================================');
  console.log(`Total Authors: ${authors.length}`);
  console.log(`Total Posts: ${posts.length}`);
  console.log(`Total Comments: ${commentCount}`);
  console.log(`Total Tags: ${tags.length}`);
  console.log('\nThis ENORMOUS DIVERSE dataset will demonstrate EXTREME N+1 query problems!');
  console.log('Expected: ~80,000+ database queries when fetching all posts!');
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
