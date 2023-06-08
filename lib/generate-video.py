from moviepy.editor import *
import random, os
import argparse

parser = argparse.ArgumentParser(description="Just an example", formatter_class=argparse.ArgumentDefaultsHelpFormatter)

parser.add_argument("-n", "--name", help="file name")

VIDEO_HEIGHT = 1920
VIDEO_WIDTH = 1080

def generate_video(name):
    backgroundFile = "backgrounds/" + random.choice(os.listdir("backgrounds"))
    videoDuration = 0

    images = []
    audios = []

    filesToHandle = ['post']
    for i in range(6):
        if os.path.exists(f'output/{i}.mp3'):
            filesToHandle.append(str(i))
    
    for file in filesToHandle:
        audioFile = AudioFileClip(f"output/{file}.mp3")
        imageFile = ImageClip(f"output/{file}.png", duration=audioFile.duration).fx(vfx.resize,width=VIDEO_WIDTH*0.9).set_position(("center","center"))

        audios.append(audioFile)
        images.append(imageFile)
        videoDuration += audioFile.duration

        if videoDuration > 90:
            break
    
    concatenatedImages = concatenate_videoclips(images).set_position(("center", "center"))
    concatenatedAudios = concatenate_audioclips(audios)

    # 3 minute limit
    if concatenatedAudios.duration > 60*2.9:
        return False
    
    background = VideoFileClip(backgroundFile).fx(vfx.resize, height=VIDEO_HEIGHT).fx(vfx.loop, duration=concatenatedImages.duration).set_position(("center","center"))

    fullVideo = CompositeVideoClip([background, concatenatedImages], (VIDEO_HEIGHT, VIDEO_WIDTH))
    fullVideo.audio = concatenatedAudios
    fullVideo.duration = concatenatedAudios.duration

    fullVideo.write_videofile(f'render/{name}.mp4', threads=8, fps=24)
    
    return True

def main():
    args = parser.parse_args()
    config = vars(args)

    videoWasCreated = generate_video(config["name"])

    if (videoWasCreated):
        print('VIDEO_WAS_CREATED')
    else:
        print('VIDEO_WASNT_CREATED')

main()