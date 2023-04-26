build:
	docker build -t voice-chatGPT-bot .

run:
	docker run -d -p 3000:3000 --name voice-chatGPT-bot --rm voice-chatGPT-bot