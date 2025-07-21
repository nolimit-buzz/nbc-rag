import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';
import { UsersService } from 'src/users/users.service';
import { MongodbService } from 'src/mongodb/mongodb.service';
import { User } from 'src/users/user.entity';
import { UserSchema } from 'src/users/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
    providers: [
        WebsocketsGateway,
        UsersService,
        MongodbService
    ],
})
export class WebsocketsModule {
}
