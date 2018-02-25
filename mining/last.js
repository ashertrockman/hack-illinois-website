'use strict';
let req = require('request');
let fs = require('fs');
let async = require('async');
let mysql = require('mysql');
let conn  = mysql.createConnection({
	/* removed */
});
let glob = require('glob');
let semver = require('semver');

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


function over() {
	console.log('waiting');
	conn.query('select distinct dep, newv, oldv from illinois_updates', (err, stuff) => {
		let ds = {};

		function smth(dep, v) {
			let rels = R[dep];
			for(let i = 0; i < rels.length; i++) {
				try {
					if(semver.satisfies(rels[i], v)) {
						return rels[i];
					}
				} catch(e) {
				
				}
			}
			return null;
		}

		stuff.forEach(s => {
			ds[s.newv] = smth(s.dep, s.newv) || 'NA';
			ds[s.oldv] = smth(s.dep, s.oldv) || 'NA';
		});

		Object.keys(ds).forEach(d => {
			if(ds[d] == 'NA')
				return;

			conn.query('insert into illinois_releases set ?',
			{
				dep: stuff[0].dep,
				semver: d,
				best: ds[d]
			});
		});
	});
}
