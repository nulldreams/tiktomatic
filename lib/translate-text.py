import argparse
from deep_translator import GoogleTranslator

def translate(text):
    return GoogleTranslator(source='en', target='pt').translate(text)

parser = argparse.ArgumentParser(description="Just an example", formatter_class=argparse.ArgumentDefaultsHelpFormatter)

parser.add_argument("-t", "--text", help="text to speech")

def main():
    args = parser.parse_args()
    config = vars(args)

    print(translate(config["text"]))

main()