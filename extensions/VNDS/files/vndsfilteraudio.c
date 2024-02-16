#include <stdio.h>
#include <stdlib.h>
#include <string.h>



#include <SDL/SDL.h>
#include <SDL/SDL_mixer.h>


int main(int argc, char **argv) {

    SDL_Init(SDL_INIT_AUDIO);
    int lastcmd = 0;
    Mix_Chunk* sound;
    Mix_Music* music;
    sound=NULL;
    music=NULL;
    int b = 0;
    long srate = 22050;   
    
     
    char buf[200];

    int quit = 0;
    while (!quit) {
        
            
                                                                                     
  	if (gets(buf)==NULL) {break;}


          //  cout  << buffer;
             
            
            if (buf[0] == 'v' && buf[1] == 'n') {
		char str[200];
                int i = 0; // znak
                int i2 = 0;
                int c = 0;

   for (i=0;i<strlen(buf);i++) {
   if (c==1) {
     c=0;
     switch (buf[i]) {
        case 's': str[i2]=' '; i2++; break;
        case 'l': str[i2]='/'; i2++; break;
        case 'e': str[i2]='~'; i2++; break;
        case 'd': str[i2]='.'; i2++; break;
        case 'b': str[i2]='\\'; i2++; break;
        case '_': str[i2]='_'; i2++; break;

}

 } else {
      if (buf[i]=='_') {c=1;}
      else {str[i2]=buf[i]; i2++;}


}

}
 str[i2]='\0';
 if (str[i2-1]==' ') {str[i2-1]='\0';}



                printf("'%s'\n",str);
                char  cmd[6][100];
		i = 0; // znak
		i2 = 0;
                c = 0;
                for (i=0;i<strlen(str);i++)
                {
                    if (str[i]=='~')
                    {
                       cmd[c][i2]='\0';
                       i2=0; 		       	
                    c++;        
                    }
                    else { cmd[c][i2]=str[i]; i2++;}
		    
                } 
                
                cmd[c][i2]='\0';
                         
                
                int new_last = atoi(cmd[1]);

                if (new_last != lastcmd) {
                    lastcmd = new_last;
                    int loops; 
                    int x = atoi(cmd[2]);
                    switch (x) {
                        case 0: // stop , quit to game list
                            
                            
                            if (b==1) {
                                Mix_HaltChannel(-1);
                                Mix_HaltMusic();
                                
                                Mix_CloseAudio();}
                            b = 0;
                            break;
                        case 1:
                            srate=atoi(cmd[3]);  
                            if (b==0) {Mix_OpenAudio(srate, MIX_DEFAULT_FORMAT, 2, 4096);}
                            b =1;
                            break;
                        case 2: //music x
                      
                            if (b==1)
                            {
                            printf("music %s\n",cmd[3]); 
                            if (music!=NULL) {Mix_FreeMusic(music);}
                            music = Mix_LoadMUS(cmd[3]);
                            Mix_PlayMusic(music, -1);}
                            break;
                        case 3: // music ~
                            if (b==1) {Mix_HaltMusic();}
                            break;
                        case 4: // sound x n
                            
                            if (b==1) {
                            Mix_HaltChannel(-1);  
                            if (sound!=NULL) {Mix_FreeChunk(sound);}
                            printf("sound %s\n",cmd[3]);
                            sound = Mix_LoadWAV(cmd[3]);
                            loops = atoi(cmd[4]);
                            Mix_PlayChannel(-1, sound, loops);}
                            break;
                        case 5: // sound ~
                		if (b==1) {
                            Mix_HaltChannel(-1);
 				}
                            break;    
                        case 6: // music OFF    
                            
                            if (b==1) {
                                Mix_HaltChannel(-1);
                                Mix_HaltMusic();
                                Mix_CloseAudio();}
                            b = 0;
                            break;
                        case 7: // music ON
                            
                            if (b==0) {Mix_OpenAudio(srate, MIX_DEFAULT_FORMAT, 2, 4096);}
                            b =1;
                            break;
                        case 8: // volumes
                            Mix_VolumeMusic(atoi(cmd[3]));
                            Mix_Volume(-1,atoi(cmd[4]));
                            
                            break;
                        case 9:
                            quit=1;
                            break;
                    }
                } 
            }
        


    }
    if (b==1){
    Mix_HaltMusic();
    Mix_HaltChannel(-1); 
    Mix_CloseAudio();
    }
    Mix_FreeMusic(music);
    Mix_FreeChunk(sound);
    

    return EXIT_SUCCESS;

}
