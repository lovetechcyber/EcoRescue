const aws = require('aws-sdk');
const vision = require('@google-cloud/vision').ImageAnnotatorClient;
const crypto = require('crypto');

const provider = process.env.MODERATION_SERVICE || 'aws_rekognition';

async function moderateImageBuffer(buffer) {
  if (provider === 'aws_rekognition') {
    const Rekognition = new aws.Rekognition({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    // Call detectModerationLabels
    const params = { Image: { Bytes: buffer } };
    const result = await Rekognition.detectModerationLabels(params).promise();
    // result.ModerationLabels is array
    const labels = result.ModerationLabels || [];
    const flagged = labels.some(l => {
      // flag on high confidence explicit content or violence
      return l.Confidence >= 75 && ['Explicit Nudity', 'Violence', 'Drugs'].some(keyword => l.Name.includes(keyword));
    });
    return { provider: 'aws_rekognition', flagged, labels };
  } else if (provider === 'google_vision') {
    const client = new vision();
    const [res] = await client.safeSearchDetection({ image: { content: buffer }});
    const annotation = res.safeSearchAnnotation;
    // decide flagged if adult/violence likely/very likely
    const flagged = ['LIKELY','VERY_LIKELY'].some(level =>
      annotation.adult === level || annotation.violence === level || annotation.racy === level
    );
    return { provider: 'google_vision', flagged, annotation };
  } else {
    // simple heuristic local fallback: check image size or entropy? For now: not flagged
    return { provider: 'local', flagged: false, reason: 'no-op fallback' };
  }
}

module.exports = { moderateImageBuffer };
