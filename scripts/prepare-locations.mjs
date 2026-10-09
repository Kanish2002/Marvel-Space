import sharp from 'sharp';
const files={titan:'exec-1e2c66d8-9cd3-42cd-9321-c6d2d576f274.png',xavier:'exec-cc23b1cc-4a8e-4057-beed-e07bb91eff6d.png',hellskitchen:'exec-83180652-7a3d-4790-bf7a-e3ae5bb0b8d9.png',queens:'exec-9faad594-378a-4661-8861-f37b12b82fac.png',attilan:'exec-c23210c4-1da6-4684-977b-ba5739aeeb34.png'};
for(const [id,file]of Object.entries(files)){await sharp(new URL('../../generated_images/'+file,import.meta.url).pathname).resize(1536,1024).webp({quality:86}).toFile(new URL(`../public/assets/locations/${id}.webp`,import.meta.url).pathname);console.log('Prepared',id);}
