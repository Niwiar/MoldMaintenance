const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const flash = require('express-flash');
const cookieSession = require('cookie-session');
const cors = require('cors');
require('dotenv').config();

const logger = require('./libs/logger');
const PORT = process.env.PORT;

app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'script')));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cookieSession({
    name: 'session',
    keys: ['key1, key2'],
    maxAge: 1000 * 60 * 60 * 24 * 365,
  })
);

app.use(flash());

const indexRoute = require('./routes/index');
const userRoute = require('./routes/user');

const importMasterRoute = require('./routes/master/import_master');
const moldMasterRoute = require('./routes/master/mold_master');
const partMasterRoute = require('./routes/master/part_master');
const mcMasterRoute = require('./routes/master/mc_master');
const problemMasterRoute = require('./routes/master/problem_master');
const checkMasterRoute = require('./routes/master/check_master');
const userMasterRoute = require('./routes/master/user_master');
const permissionMasterRoute = require('./routes/master/permission_master');

const dropdownRoute = require('./routes/main/dropdown');
const repairRoute = require('./routes/main/repair_order');
const pmRoute = require('./routes/main/pm_order');

const performanceRoute = require('./routes/dm/performance');
const reportRoute = require('./routes/dm/report');

// Page & User
app.use('/', indexRoute);
app.use('/user', userRoute);

// Master Setting
app.use('/import_master', importMasterRoute);
app.use('/mold_master', moldMasterRoute);
app.use('/part_master', partMasterRoute);
app.use('/mc_master', mcMasterRoute);
app.use('/problem_master', problemMasterRoute);
app.use('/check_master', checkMasterRoute);
app.use('/user_master', userMasterRoute);
app.use('/permission_master', permissionMasterRoute);

// Main
app.use('/dropdown', dropdownRoute);
app.use('/repair', repairRoute);
app.use('/pm', pmRoute);

// DM
app.use('/performance_dm', performanceRoute);
app.use('/report', reportRoute);

// Error
app.use((err, req, res, next) => {
  if (err.status) logger.warn(`${req.method} ${req.originalUrl} ${err}`);
  else logger.error(`${req.method} ${req.originalUrl} ${err}`);
  res.status(err.status || 500).send({ message: `${err}` });
});

const { socketConnection } = require('./libs/socket-io');
let server = require('http').createServer(app);
server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
socketConnection(server);
