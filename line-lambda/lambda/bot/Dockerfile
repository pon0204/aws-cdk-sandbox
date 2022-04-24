FROM public.ecr.aws/lambda/nodejs:12

COPY package.json ./
RUN npm install
COPY . .

CMD ["index.handler"]