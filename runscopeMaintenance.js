"use strict";

const fs = require('fs');
const axios = require('axios');
const log = require("./lib/helpers/logger");
//settings.js file with apikey, buckets to modify location on scheduled environments
const settings = require('./settings.js');
const {apikey, buckets, altUrl} = settings;
const apiUrl = "https://api.runscope.com";

let outputData = [];
const baseUrl = altUrl || apiUrl;
log.debug(baseUrl);



const authHeader = `Bearer ${apikey}`;
axios.defaults.headers.common['Authorization'] = authHeader;
log.info(buckets);

function getRunscope(endpointUrl) {
	return axios.get(endpointUrl,);
}

(async function run() {
	try {
		for (let i = 0; i < buckets.length; i++){
			let bucket_key = buckets[i];
			log.info(`Getting bucket ${bucket_key}`)

			//get list of shared environments for the bucket
			const sharedEndpoint = `${baseUrl}/buckets/${bucket_key}/environments`;
			const sharedEnvs = await getRunscope(sharedEndpoint);
			const sharedEnvArray = sharedEnvs.data.data;
			const sharedEnvIds = sharedEnvArray.map(a => a.id);
			log.info(sharedEnvIds);
			const testList = `${baseUrl}/buckets/${bucket_key}/tests?count=100`;
			const results = await getRunscope(testList);
			
			let thisBatch = results.data.data;
			for (let j = 0; j < thisBatch.length; j++){
				const test_id = thisBatch[j].id;
				const schedUrl = `${baseUrl}/buckets/${bucket_key}/tests/${test_id}/schedules`
				const schedResults = await getRunscope(schedUrl);
				
				if (schedResults.data.data.length > 0) {
					let thisData = {
						"test_id":test_id,
						"schedule" : schedResults.data.data
					}
					outputData.push(thisData);
				}
			}
			
			log.info(outputData);
		}		
	} catch (e) {
    log.info(e);
  }
})();
//const schedUrl = `${baseUrl}/buckets/${bucket_key}/tests/${test_id}/schedules`