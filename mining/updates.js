'use strict';
let fs = require('fs');
let exec = require('child_process').exec;
let semver = require('semver');
let semDiff = require('semver-diff');
let async = require('async');
let mysql = require('mysql');
let conn  = mysql.createConnection({
	/* removed */
});


function packageJson(data, cb) {
	exec('git -C ' + data.dir + ' show ' + data.commit + ':package.json', (err, sout, serr) => {
		if(err || serr)
			return cb(err || serr);

		let j;
		try {
			j = JSON.parse(sout);
		} catch(e) {
			return cb(e);	
		}
		return cb(null, j);
	});
}

function findUpdates(a, b) {

	let deps_a = a.json.dependencies;
	let deps_b = b.json.dependencies;
	if(!deps_a || !deps_b)
		return [];
	let res = [];

	Object.keys(deps_a).forEach(key => {
		let prev = latest(key, deps_b[key]);
		let cur = latest(key, deps_a[key]);

		if(prev && cur && prev != cur) {
			res.push({
				dep: key,
				prev, cur
			});
		}
	});
	return res;
}

function latest(dep, v) {
	let rels = R[dep];
	if(!rels)
		return v;

	for(let i = 0; i < rels.length; i++) {
		try {
			if(semver.satisfies(rels[i], v)) {
				return rels[i];
			}
		} catch(e) {
		
		}
	}

	return v;
}

function updatesBetween(dir, commit_a, commit_b, cb) {
	async.mapSeries([{dir, commit:commit_a}, {dir, commit:commit_b}], packageJson,
	(err, res) => {
		if(err)
			return cb(err);

		let updates = findUpdates({commit: commit_a, json: res[0]}, {commit: commit_b, json: res[1]});
		cb(null, updates);
	});
}

function process(slug, cb) {
	let xslug = slug.replace('/', '_____');
	let dir = '/---/atrockman/badge_repos/' + xslug;

	exec('git -C ' + dir + ' log --follow --first-parent --pretty=format:\"%H::%at\" package.json', (err, sout, serr) => {
		if(err || serr)
			return cb(err || serr);


	
		let lines = sout.split('\n');		
		let commits = [];
		let dates = {};

		for(let line of lines) {
			let parts = line.split('::');
			let commit = parts[0];
			let date = parts[1];
			commits.push(commit);
			dates[commit] = date;
		}

		let n = commits.length
		let tuples = []
		console.log(slug, n);

		for(let i = 0; i < n - 1; i++) {
			tuples.push([i, i + 1]);
		}

		console.log('async');
		async.eachLimit(tuples, 5, (tuple, done) => {
			updatesBetween(dir, commits[tuple[0]], commits[tuple[1]], (err, res) => {

				console.log(dates[commits[tuple[0]]]);
				if(err)
					return done();

				let called = false;
				res.forEach(x => {
					try {
						conn.query('insert into illinois_updates_3 set ?',
						{
							slug,
							commit: commits[tuple[0]],
							oldv: x.prev,
							newv: x.cur,
							dep: x.dep,
							date: new Date(1000*dates[commits[tuple[0]]])
						}, (err, res) => {
							console.log(err);	
						});
					}catch(e){
						console.log('problems');
					}
				});

				done();

			});
		}, cb);
	});
}

function over() {
	conn.query('select distinct slug from fixed_dev_packages order by downloads desc', (err, rows) => {

		let slugs = rows.map(x => x.slug);
		slugs = slugs.slice(slugs.indexOf('Polymer/polymer-build'));

		async.eachLimit(slugs, 1, (slug, done) => {
			console.log(slug);	
			process(slug, (err, res) => {
				console.log(err);
				done();
			});
		});
	});
}

let R = {}

conn.query('select distinct dep from illinois_updates', (err, res) => {
	let deps = res.map(x => x.dep);	
	async.eachLimit(deps, 1, (dep, done) => {
		console.log(dep);
		conn.query('select * from releases where name = ? order by date desc', dep, (err, releases) => {
			let rels = releases.map(x => x.version);
			R[dep] = rels;
			done();
		});
	}, over);
});
