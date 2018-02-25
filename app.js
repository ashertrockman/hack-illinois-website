const express = require('express')
const app = express()
const mysql = require('mariasql')
const semver = require('semver');
const moment = require('moment');

const conn = new mysql({
	user: 'root',
	password: 'password',
	host: '127.0.0.1',
	db: 'deps',
	port: 3306
})


function sat(v, R) {
	try {
		let s = semver.satisfies(v, R);	
		return s;
	} catch(e) {
		return false;
	}
}

app.get('/api/:name/:version', (req, res) => {
	console.log(req.params.name);
	console.log(req.params.version);

	let name = req.params.name;
	let version = req.params.version;

	let query = 'select a.slug, dep, oldv, newv, a.commit, state, max(date) as date from illinois_updates_3 a join illinois_builds b on a.commit = b.commit where dep = "' + name + '" group by a.slug';

	conn.query(query,
	(err, rows) => {
		if(version)
			rows = rows.filter(x => sat(x.newv, version));

		rows.forEach(x => {
			x.before = moment(x.date).subtract(7, 'days').format('YYYY-MM-DD');
			x.after = moment(x.date).add(7, 'days').format('YYYY-MM-DD');
		});

		let total = rows.length;

		let cnt = rows.reduce( (acc, val) => acc + (val.state == 'failed' ? 1 : 0), 0);
		let avg =  cnt / rows.length;
		return res.send({total, cnt, avg, data: rows});
	});
});

conn.query('show databases', console.log);

app.use(express.static('public'))

app.listen(80, () => console.log('Example app listening on port 3000!'))
