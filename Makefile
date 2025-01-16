build:
	docker build -t sjc.vultrcr.com/eti1/geojson.io:$(shell npm pkg get version | tr -d '"') .