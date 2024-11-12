build:
	docker build -t docker.etisoftware.com/geojson.io:$(shell npm pkg get version | tr -d '"') .