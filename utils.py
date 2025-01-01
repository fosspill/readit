import random
import string

def generate_memorable_code(length: int = 8) -> str:
    consonants = 'bcdfghjklmnpqrstvwxz'
    vowels = 'aeiouy'
    
    code = ''
    for i in range(length // 2):
        code += random.choice(consonants) + random.choice(vowels)
    
    if length % 2:
        code += random.choice(consonants)
    
    return code 