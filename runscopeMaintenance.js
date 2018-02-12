"use strict";

const fs = require('fs');
const axios = require('axios');
const moment = require("moment");
const log = require("./lib/helpers/logger");
//settings.js file with apikey, buckets to modify location on scheduled environments
const settings = require('./settings.js');
let {apikey, buckets, altUrl} = settings;
const apiUrl = "https://api.runscope.com";

//array to store scheduled tests
let testSchedules = [];

//restoreFileData
let restoreData = [];


var args = process.argv.slice(2);
log.debug(args[0]);
if (!((args[0] === 'pause') || (args[0] === 'resume'))) {
    throw new Error('FAIL: You must indicate "pause" or "resume"');
}




   var operation = args[0];
   if(args[0] === 'resume' && !args[1]) {
   	throw new Error('FAIL: You must provide a filename to restore schedules')
   }
   var restoreFileName = args[1];
log.debug(args);
log.debug(args.length);
const baseUrl = altUrl || apiUrl;
log.debug(baseUrl);



const authHeader = `Bearer ${apikey}`;
axios.defaults.headers.common['Authorization'] = authHeader;
log.debug(buckets);

function getRunscope(endpointUrl) {
	return axios.get(endpointUrl,);
}

function deleteRunscopeSchedule(endpointUrl) {
	return axios.delete(endpointUrl,);
}

function writeRunscopeSchedule(endpointUrl,postData) {
	return axios.post(endpointUrl,postData);
}

(async function run() {
	try {
		for (let i = 0; i < buckets.length; i++){
			let bucket_key = buckets[i];
			log.info(`Getting bucket ${bucket_key}`)

			//get list of tests for this bucket
			const testList = `${baseUrl}/buckets/${bucket_key}/tests?count=100`;
			const results = await getRunscope(testList);
			log.debug(`This is the status code: ${results.status}`);
			
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

					//array of test schedules
					testSchedules.push(thisScheduleData);
					//log.debug(JSON.stringify(thisScheduleData,undefined,4));
				}
			}
			
			log.debug(JSON.stringify(testSchedules,undefined,4));
			let jsonWriteData = JSON.stringify(testSchedules,undefined,4);
			let jsonFileName = `${bucket_key}-${moment().format("YYYYMMDDHmmss")}.json`;
			writeToFile(jsonWriteData,jsonFileName);

			log.debug("going to write tasks to delete");
			
			//this should probably be a function...
			//deleteListOfSchedules(testSchedules);
			let taskList = [];
			//loop through tests in file
			for (let count = 0; count < testSchedules.length; count++){
				let thisTestSched = testSchedules[count];
				let thisBucket = thisTestSched.bucket_key;
				let thisTest = thisTestSched.test_id;
				//loop through schedules in test
				log.debug("loop through schedules");
				for (let schedCount = 0; schedCount < thisTestSched.schedule.length; schedCount++){
					let thisRestore = {};
					let restoreUrl = `${baseUrl}/buckets/${thisBucket}/tests/${thisTest}/schedules`;
					let deleteUrl = `${restoreUrl}/${thisTestSched.schedule[schedCount].id}`; 
					log.debug(`URL to delete: ${deleteUrl}`);
					thisRestore.url = restoreUrl;
					
					thisRestore.data = {
						"environment_id": thisTestSched.schedule[schedCount].environment_id,
						"interval": thisTestSched.schedule[schedCount].interval,
						"note": thisTestSched.schedule[schedCount].note
					}; 
					taskList.push(deleteUrl);
					//deleteRunscopeSchedule
					const deleteResult = await deleteRunscopeSchedule(deleteUrl);
					thisRestore.deleteStatus = deleteResult.status;
					const createResults = await writeRunscopeSchedule(thisRestore.url,thisRestore.data)
					thisRestore.restoreStatus = createResults.status
					restoreData.push(thisRestore);
				}
			}

			log.warn(taskList);
			jsonWriteData = JSON.stringify(restoreData,undefined,4);
			jsonFileName = `restore-${bucket_key}-${moment().format("YYYYMMDDHmmss")}.json`;
			writeToFile(jsonWriteData,jsonFileName);





			//log.debug(schedudedEnvironments);
		}		
	} catch (e) {
    log.warn(e);
  }
})();
//const schedUrl = `${baseUrl}/buckets/${bucket_key}/tests/${test_id}/schedules`
//


//writes data to file
function writeToFile(outputData,fileName){
  fs.appendFile(fileName, outputData, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("Saved data to: "+ fileName);
  });  
}