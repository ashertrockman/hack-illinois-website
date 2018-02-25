'use strict';
let req = require('request');
let fs = require('fs');
let async = require('async');
let mysql = require('mysql');
let conn  = mysql.createConnection({
	/* removed */
});

let glob = require('glob');

glob('/---/atrockman/build_json_2/*', (err, files) => {
	console.log('retrieved');
	async.eachLimit(files, 1, (f, done) => {
		console.log(f);
		let json = JSON.parse(fs.readFileSync(f));
		async.eachLimit(json.builds, 1, (build, done) => {
			let slug = build.repository.slug;				
			conn.query('insert into illinois_builds set ?',
			{
				slug: slug,
				build_id: build.id,
				event_type: build.event_type,
				state: build.state,
				commit: build.commit.sha
			}, (err, res) => {
				done();
			});
		}, done);
	});
});


