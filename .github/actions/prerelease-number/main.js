//Trying to avoid any npm installs or anything that takes extra time...
const   https = require('https'),
        zlib = require('zlib'),
        fs = require('fs'),
        env = process.env;

function fail(message, exitCode=1) {
    console.log(`::error::${message}`);
    process.exit(1);
}

function request(method, path, data, callback) {
    
    try {
        if (data) {
            data = JSON.stringify(data);
        }  
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data ? data.length : 0,
                'Accept-Encoding' : 'gzip',
                'Authorization' : `token ${env.INPUT_TOKEN}`,
                'User-Agent' : 'GitHub Action - development'
            }
        }
        const req = https.request(options, res => {
    
            let chunks = [];
            res.on('data', d => chunks.push(d));
            res.on('end', () => {
                let buffer = Buffer.concat(chunks);
                if (res.headers['content-encoding'] === 'gzip') {
                    zlib.gunzip(buffer, (err, decoded) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, res.statusCode, decoded && JSON.parse(decoded));
                        }
                    });
                } else {
                    callback(null, res.statusCode, buffer.length > 0 ? JSON.parse(buffer) : null);
                }
            });
    
            req.on('error', err => callback(err));
        });
    
        if (data) {
            req.write(data);
        }
        req.end();
    } catch(err) {
        callback(err);
    }
}

function main() {
  const path = 'PRERELEASE_NUMBER/PRERELEASE_NUMBER';
        
  if (!env.INPUT_BRANCH) fail(`ERROR: Input parameter branch is not defined.`);
  if (!env.INPUT_PRERELEASE_TYPE) fail(`ERROR: Input parameter prerelease_type is not defined.`);
        
  const branch = `${env.INPUT_BRANCH}`;
  const branchName = `${env.INPUT_BRANCH##*/}`;
  const prereleaseType = `${env.INPUT_PRERELEASE_TYPE}`;
        
  console.log(`Branch: ${branch}`);
  console.log(`Branch name: ${branchName}`);
  console.log(`Prerelease type: ${prereleaseType}`);
        
  //See if we've already generated the build number and are in later steps...
  if (fs.existsSync(path)) {
      let prereleaseNumber = fs.readFileSync(path);
      console.log(`Prerelease number already generated in earlier jobs, using prerelease number ${prereleaseNumber}...`);
      //Setting the output and a environment variable to new prerelease number...
      fs.writeFileSync(process.env.GITHUB_ENV, `PRERELEASE_NUMBER=${prereleaseNumber}`);
      console.log(`::set-output name=prerelease_number::${prereleaseNumber}`);
      return;
  }
        
  //Some sanity checking:
  for (let varName of ['INPUT_TOKEN', 'GITHUB_REPOSITORY', 'GITHUB_SHA']) {
      if (!env[varName]) {
          fail(`ERROR: Environment variable ${varName} is not defined.`);
      }
  }
        
  /*request('GET', `/repos/${env.GITHUB_REPOSITORY}/git/refs/tags/${prefix}build-number-`, null, (err, status, result) => {
      let nextBuildNumber, nrTags;
          
      if (status === 404) {
          console.log('No prerelease-number ref available, starting at 1.');
          nextBuildNumber = 1;
          nrTags = [];
      }
  });*/
  
  return;
}

main();
