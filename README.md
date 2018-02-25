# npm Dependency Insights
#### HackIllinois 2018 Submission

## Inspiration

npm packages are known for having large numbers of dependencies, which means that there is a substantial amount of overhead associated with keeping them up-to-date and secure. A single project may be depended upon by hundreds of thousands of projects, so a significant (perhaps breaking) change to a package can have large consequences for all of npm.

To alleviate this situation, tools such as David DM and Greenkeeper have been created to help developers manage and upgrade dependencies. Such tools can notify developers when dependencies are out of date or insecure, and can automatically upgrade and run tests with new versions of dependencies.

However, these tools are ineffective in making developers aware of the problems that others may be facing in the community: they do not readily help maintainers understand how their new release affected downstream projects, and they do not necessarily help developers understand the changes and consequences associated with new releases.

We believe that transparency and interconnectedness are invaluable to open source. Hence, we created a tool which leverages data from npm, GitHub, and Travis CI to make the challenges associated with upgrading dependencies more visible. Project maintainers can use our tool to determine if their release causes broken builds downstream, and more generally, npm developers can use it to estimate the effort required for an upgrade, or to determine how other developers resolved issues.

## Approach

We used publicly available data from the GitHub repositories associated with npm packages, as well as build data from Travis CI.

For each repository, we extract dependency upgrade events from the `package.json` file. We then look at the correspond build status on Travis CI to determine, generally, if the upgrade is associated with broken tests. We can determine what percentage of upgrades of certain dependencies are associated with broken builds. 

To make this data accessible, we created an [easy-to-use website](http://130.211.131.166), which provides statistics for specific version ranges for packages. For each upgrade event, we also provide a link to GitHub issues which may be of interest in learning the reason for a breaking build or how the problem was solved.

Our web app is written in Node.js using the Express framework. The front-end uses Angular.js and Bootstrap. Data extraction and processing was done in Node.js, and the data was stored in a MySQL database. The website runs on a Google Cloud Platform Compute Engine.
