const Aws = require('aws-sdk'); // eslint-disable-line import/no-unresolved

const ddb = new Aws.DynamoDB.DocumentClient();

const db = {
  feedback: {
    save: async (sessionId, sessionURL, feedback, sentiment, githubURL) => {
      // TODO: validate input
      const params = {
        TableName: process.env.FEEDBACK_TABLE_NAME,
        Item: {
          sessionId,
          sessionURL,
          feedback,
          sentiment,
          githubURL,
          date: new Date().toISOString(),
        },
      };

      try {
        const putResult = await ddb.put(params).promise();
        console.log(`feedback saved for sessionId: ${sessionId}`);
        return putResult;
      } catch (e) {
        console.log(`error saving feedback: ${JSON.stringify(e)}`);
        throw e;
      }
    },
    get: async (sentimentFilter = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED', 'RAGE']) => {
      const ExpressionAttributeValues = sentimentFilter.reduce((acc, value, index) => {
        acc[`:filter${index + 1}`] = value;
        return acc;
      }, {});
      const FilterExpression = `#sentiment in (${Object.keys(ExpressionAttributeValues).join(',')})`;
      const ExpressionAttributeNames = { '#sentiment': 'sentiment' };
      const params = {
        TableName: process.env.FEEDBACK_TABLE_NAME,
        ExpressionAttributeValues,
        ExpressionAttributeNames,
        FilterExpression,
      };

      console.log(`getting feedback with params ${JSON.stringify(params)}`);

      try {
        const data = await ddb.scan(params).promise();
        console.log(`retrieved feedback from ddb ${JSON.stringify(data)}`);
        return data.Items.sort((a, b) => b.date.localeCompare(a.date));
      } catch (e) {
        console.log(`error retrieving feedback: ${e}`);
        throw e;
      }
    },
  },
};

module.exports = db;
