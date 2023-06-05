import asyncio
import argparse
import edge_tts

parser = argparse.ArgumentParser(description="Just an example", formatter_class=argparse.ArgumentDefaultsHelpFormatter)

parser.add_argument("-t", "--text", help="text to speech")
parser.add_argument("-n", "--name", help="file name")

VOICE_BR = "Microsoft Server Speech Text to Speech Voice (pt-BR, AntonioNeural)"
VOICE_EN = "Microsoft Server Speech Text to Speech Voice (en-US, ChristopherNeural)"

def get_voice():
    choicedVoice = VOICE_EN
    return choicedVoice

async def generate(text,name,voice):
    try:
        communicate = edge_tts.Communicate(text,voice=voice)
        with open(f"output/{name}.mp3","wb") as fp:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    fp.write(chunk["data"])
    except Exception as error:
        print(error)
        raise error

async def main():
    voice = get_voice()
    args = parser.parse_args()
    config = vars(args)

    await generate(config["text"], config["name"], voice)
    print('finished')

asyncio.run(main())