const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// 模拟数据库
let news = [
  { id: 1, title: '江西软件职业技术大学举办编程大赛', content: '为提高学生的编程能力，我校将于下月举办大型编程竞赛...', date: '2023-05-01', category: '学术活动' },
  { id: 2, title: '我校与多家IT企业签署合作协议', content: '为促进产学研结合，江西软件职业技术大学与多家知名IT企业签署了合作协议...', date: '2023-05-02', category: '校企合作' }
];

const categories = ['学术活动', '校企合作', '校园生活', '就业信息'];

const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'student', password: 'student123', role: 'student' }
];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// 中间件：检查用户是否已登录
const requireLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// 中间件：检查用户是否为管理员
const requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).send('权限不足');
  }
};

// 登录页面
app.get('/login', (req, res) => {
  res.render('login');
});

// 处理登录
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.redirect('/');
  } else {
    res.render('login', { error: '用户名或密码错误' });
  }
});

// 注销
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// 首页 - 新闻列表
app.get('/', requireLogin, (req, res) => {
  const { category, search } = req.query;
  let filteredNews = news;

  if (category) {
    filteredNews = filteredNews.filter(item => item.category === category);
  }

  if (search) {
    filteredNews = filteredNews.filter(item => 
      item.title.toLowerCase().includes(search.toLowerCase()) || 
      item.content.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.render('index', { 
    news: filteredNews, 
    categories, 
    currentCategory: category, 
    search,
    user: req.session.user
  });
});

// 查看新闻详情
app.get('/news/:id', requireLogin, (req, res) => {
  const newsItem = news.find(item => item.id === parseInt(req.params.id));
  if (newsItem) {
    res.render('news', { newsItem, user: req.session.user });
  } else {
    res.status(404).send('新闻不存在');
  }
});

// 添加新闻页面
app.get('/add', requireAdmin, (req, res) => {
  res.render('add', { categories, user: req.session.user });
});

// 处理添加新闻
app.post('/add', requireAdmin, (req, res) => {
  const { title, content, category } = req.body;
  const newNews = {
    id: news.length + 1,
    title,
    content,
    category,
    date: new Date().toISOString().split('T')[0]
  };
  news.push(newNews);
  res.redirect('/');
});

// 编辑新闻页面
app.get('/edit/:id', requireAdmin, (req, res) => {
  const newsItem = news.find(item => item.id === parseInt(req.params.id));
  if (newsItem) {
    res.render('edit', { newsItem, categories, user: req.session.user });
  } else {
    res.status(404).send('新闻不存在');
  }
});

// 处理编辑新闻
app.post('/edit/:id', requireAdmin, (req, res) => {
  const { title, content, category } = req.body;
  const id = parseInt(req.params.id);
  const newsIndex = news.findIndex(item => item.id === id);
  if (newsIndex !== -1) {
    news[newsIndex] = { ...news[newsIndex], title, content, category };
    res.redirect('/');
  } else {
    res.status(404).send('新闻不存在');
  }
});

// 删除新闻
app.post('/delete/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  news = news.filter(item => item.id !== id);
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});