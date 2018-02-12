"use strict";

const fs = require('fs');
const axios = require('axios');
const log = require("./lib/helpers/logger");
//settings.js file with apikey, buckets to modify location on scheduled environments
const settings = require('./settings.js');
const {apikey, buckets, altUrl} = settings;
const apiUrl = "https://api.runscope.com";

//array to store scheduled tests
let testSchedules = [];
//array of environments that are scehedule, and whether they are shared
let schedudedEnvironments = [];
const baseUrl = altUrl || apiUrl;
log.debug(baseUrl);



const authHeader = `Bearer ${apikey}`;
axios.defaults.headers.common['Authorization'] = authHeader;
log.debug(buckets);

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
			//create an array of Shared Environments to see if scheduled environments are shared
			const sharedEnvIds = sharedEnvArray.map(a => a.id);
			log.debug(sharedEnvIds);

			//get list of tests for this bucket
			const testList = `${baseUrl}/buckets/${bucket_key}/tests?count=100`;
			const results = await getRunscope(testList);
			
			let thisBatch = results.data.data;
			for (let j = 0; j < thisBatch.length; j++){
				const test_id = thisBatch[j].id;
				//get schedules for tests in this buckets
				const schedUrl = `${baseUrl}/buckets/${bucket_key}/tests/${test_id}/schedules`
				const schedResults = await getRunscope(schedUrl);
				//look for tests which actually have schedules
				
				let scheduleData = schedResults.data.data
				if (scheduleData.length > 0) {
					let thisScheduleData = {
						"bucket_key":bucket_key,
						"test_id":test_id,
						"schedule" : scheduleData
					}

					for (let k = 0; k < scheduleData.length; k++) {

						let schedEnv = scheduleData[k].environment_id;
						let isShared = sharedEnvIds.indexOf(schedEnv) > 0;
						let thisScheduledEnvironment = {
							"bucket_key": bucket_key,
							"test_id": test_id,
							"environment_id": schedEnv,
							"isShared": isShared,
							"interval": scheduleData[k].interval,
							"doesInherit": false
						};

						//find out if we have this environment already
						let obj = schedudedEnvironments.find(function (obj) { return obj.environment_id === schedEnv; });
						log.debug('checking duplicates');
						if(!obj){
							log.debug('getting environment details');
							let envEndpoint;
							if(isShared){
								envEndpoint = `${baseUrl}/buckets/${bucket_key}/environments/${schedEnv}`
							} else {
								envEndpoint = `${baseUrl}/buckets/${bucket_key}/tests/${test_id}/environments/${schedEnv}`
							}

							//get details of the environment
							log.warn(envEndpoint);
							const environmentDetailsResults = await getRunscope(envEndpoint);
							const environmentDetailsData = environmentDetailsResults.data.data
							//for shared environment, get locations & agent
							if(isShared){
								thisScheduledEnvironment.regions = environmentDetailsResults.regions;
								thisScheduledEnvironment.remote_agents = environmentDetailsResults.remote_agents;
								environmentDetailsResults.regions = [];
								environmentDetailsResults.remote_agents = [];
							} else {
								//first check to see if it inherits from a shared environment
								if (environmentDetailsData.parent_environment_id) {
									log.warn(`We have a parent ID ${environmentDetailsData.parent_environment_id}`);
									const thisParent = environmentDetailsData.parent_environment_id;
									thisScheduledEnvironment.doesInherit = true;
									thisScheduledEnvironment.parent_id = thisParent;
									//check to see if we already have this parent
									let parentObj = schedudedEnvironments.find(function (parentObj) { return parentObj.environment_id === thisParent; });
									if(parentObj){
										log.warn('we already have this parent');
									} else {
										log.warn('this parent is new');
									}

								}
							}
							log.debug(environmentDetailsResults.data);
							
						} else {
							//get info from duplicate
							log.warn(obj);
						}

						schedudedEnvironments.push(thisScheduledEnvironment);
					}


					//array of test schedules
					testSchedules.push(thisScheduleData);
					//log.debug(JSON.stringify(thisScheduleData,undefined,4));
				}
			}
			
			log.debug(testSchedules);
			log.debug(schedudedEnvironments);
		}		
	} catch (e) {
    log.warn(e);
  }
})();
//const schedUrl = `${baseUrl}/buckets/${bucket_key}/tests/${test_id}/schedules`
//
function checkAndAdd(name) {
  var found = arr.some(function (el) {
    return el.username === name;
  });
  if (!found) { arr.push({ id: id, username: name }); }
}