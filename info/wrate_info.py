from datetime import datetime

def wrate(data: str):
    data_time = str(datetime.now())[:-7]

    with open(r"info\info.txt", "a") as file:
        file.write(f"{data_time} {data}\n")
